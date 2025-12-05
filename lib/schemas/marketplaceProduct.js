export default {
  name: 'marketplaceProduct',
  title: 'Marketplace Product',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Product Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required().max(1000),
    },
    {
      name: 'image',
      title: 'Product Image',
      type: 'url',
      description: 'Product image URL',
    },
    {
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
      description: 'Price in USD',
    },
    {
      name: 'discount',
      title: 'Discount',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(100),
      description: 'Discount percentage (0-100)',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Merchandise', value: 'merchandise' },
          { title: 'Collectibles', value: 'collectibles' },
          { title: 'Digital', value: 'digital' },
          { title: 'Tickets', value: 'tickets' },
          { title: 'Services', value: 'services' },
        ],
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'stock',
      title: 'Stock',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
      description: 'Available inventory',
    },
    {
      name: 'sales',
      title: 'Sales',
      type: 'number',
      initialValue: 0,
      readOnly: true,
      description: 'Total units sold',
    },
    {
      name: 'rating',
      title: 'Rating',
      type: 'number',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(5),
      description: 'Average rating (0-5)',
    },
    {
      name: 'seller',
      title: 'Seller',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {
      title: 'title',
      seller: 'seller.name',
      price: 'price',
      stock: 'stock',
      category: 'category',
    },
    prepare({ title, seller, price, stock, category }) {
      return {
        title,
        subtitle: `$${price?.toFixed(2) || '0.00'} • ${stock || 0} in stock • ${seller || 'Unknown'}`,
        description: category,
      }
    },
  },
}
