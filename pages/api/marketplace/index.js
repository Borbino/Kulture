import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import sanityClient from '../../lib/sanityClient'

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  // GET: Fetch marketplace products
  if (req.method === 'GET') {
    try {
      const { search, category, sort = 'newest', page = 1, limit = 12, id } = req.query

      let query = '*[_type == "marketplaceProduct"'
      const params = {}

      // Filter by ID if provided
      if (id) {
        query += ' && _id == $id'
        params.id = id
      }

      // Search
      if (search) {
        query += ' && (title match $search || description match $search)'
        params.search = `${search}*`
      }

      // Category
      if (category && category !== 'all') {
        query += ' && category == $category'
        params.category = category
      }

      query += ']'

      // Sort
      switch (sort) {
        case 'price-low':
          query += ' | order(price asc)'
          break
        case 'price-high':
          query += ' | order(price desc)'
          break
        case 'popular':
          query += ' | order(sales desc)'
          break
        default:
          query += ' | order(_createdAt desc)'
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit)
      query += ` [${skip}...${skip + parseInt(limit)}]`

      // Add fields
      query = `{
        "products": ${query} {
          _id,
          title,
          description,
          image,
          price,
          discount,
          category,
          stock,
          sales,
          rating,
          seller -> {
            _id,
            name,
            email,
            image
          },
          _createdAt
        },
        "total": count(*[_type == "marketplaceProduct"${search ? ' && (title match $search || description match $search)' : ''}${category && category !== 'all' ? ' && category == $category' : ''}])
      }`

      const data = await sanityClient.fetch(query, params)

      res.status(200).json({
        products: data.products,
        total: data.total,
        page: parseInt(page),
        limit: parseInt(limit),
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Failed to fetch products' })
    }
  }

  // POST: Create marketplace product
  else if (req.method === 'POST') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const {
        title,
        description,
        image,
        price,
        discount = 0,
        category,
        stock,
      } = req.body

      // Validate
      if (!title?.trim() || !description?.trim() || !category) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      if (price < 0 || stock < 0) {
        return res.status(400).json({ error: 'Invalid price or stock' })
      }

      const userRef = `${session.user.id}`

      const product = await sanityClient.create({
        _type: 'marketplaceProduct',
        title: title.trim(),
        description: description.trim(),
        image,
        price: parseFloat(price),
        discount: Math.min(Math.max(0, parseFloat(discount)), 100),
        category,
        stock: parseInt(stock),
        sales: 0,
        rating: 0,
        seller: {
          _type: 'reference',
          _ref: userRef,
        },
      })

      res.status(201).json(product)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Failed to create product' })
    }
  }

  // PATCH: Update product or handle orders
  else if (req.method === 'PATCH') {
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
      const { productId, action, quantity = 1, paymentId } = req.body

      // Update product (seller only)
      if (action === 'update') {
        const { title, description, price, stock, discount } = req.body

        // Verify seller
        const product = await sanityClient.fetch(
          '*[_type == "marketplaceProduct" && _id == $id][0] { seller }',
          { id: productId }
        )

        if (product.seller._ref !== session.user.id) {
          return res.status(403).json({ error: 'Forbidden' })
        }

        const updated = await sanityClient
          .patch(productId)
          .set({
            ...(title && { title }),
            ...(description && { description }),
            ...(price !== undefined && { price: parseFloat(price) }),
            ...(stock !== undefined && { stock: parseInt(stock) }),
            ...(discount !== undefined && { discount: parseFloat(discount) }),
          })
          .commit()

        return res.status(200).json(updated)
      }

      // Create order
      if (action === 'order') {
        const buyerRef = `${session.user.id}`

        // Get product
        const product = await sanityClient.fetch(
          '*[_type == "marketplaceProduct" && _id == $id][0]',
          { id: productId }
        )

        if (!product) {
          return res.status(404).json({ error: 'Product not found' })
        }

        if (product.stock < quantity) {
          return res.status(400).json({ error: 'Insufficient stock' })
        }

        // Create order
        const order = await sanityClient.create({
          _type: 'marketplaceOrder',
          product: {
            _type: 'reference',
            _ref: productId,
          },
          buyer: {
            _type: 'reference',
            _ref: buyerRef,
          },
          seller: product.seller,
          quantity: parseInt(quantity),
          totalPrice: product.price * quantity * (1 - product.discount / 100),
          status: 'pending',
          paymentId,
        })

        // Update product stock and sales
        await sanityClient
          .patch(productId)
          .dec({ stock: parseInt(quantity) })
          .inc({ sales: parseInt(quantity) })
          .commit()

        return res.status(201).json(order)
      }

      // Update order status
      if (action === 'updateOrder') {
        const { orderId, status } = req.body

        const order = await sanityClient.fetch(
          '*[_type == "marketplaceOrder" && _id == $id][0] { seller }',
          { id: orderId }
        )

        if (order.seller._ref !== session.user.id) {
          return res.status(403).json({ error: 'Forbidden' })
        }

        const updated = await sanityClient
          .patch(orderId)
          .set({ status })
          .commit()

        return res.status(200).json(updated)
      }

      res.status(400).json({ error: 'Invalid action' })
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: 'Failed to update' })
    }
  }

  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
