export default {
  name: 'marketplaceOrder',
  title: 'Marketplace Order',
  type: 'document',
  fields: [
    {
      name: 'product',
      title: 'Product',
      type: 'reference',
      to: [{ type: 'marketplaceProduct' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'buyer',
      title: 'Buyer',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'seller',
      title: 'Seller',
      type: 'reference',
      to: [{ type: 'user' }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'quantity',
      title: 'Quantity',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    },
    {
      name: 'totalPrice',
      title: 'Total Price',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
      description: 'Total price after discount',
    },
    {
      name: 'status',
      title: 'Order Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Processing', value: 'processing' },
          { title: 'Shipped', value: 'shipped' },
          { title: 'Delivered', value: 'delivered' },
          { title: 'Cancelled', value: 'cancelled' },
        ],
      },
      initialValue: 'pending',
    },
    {
      name: 'paymentId',
      title: 'Payment ID',
      type: 'string',
      description: 'External payment transaction ID',
    },
  ],
  preview: {
    select: {
      product: 'product.title',
      buyer: 'buyer.name',
      quantity: 'quantity',
      totalPrice: 'totalPrice',
      status: 'status',
    },
    prepare({ product, buyer, quantity, totalPrice, status }) {
      return {
        title: `${buyer || 'Unknown'} - ${product || 'Product'}`,
        subtitle: `${quantity}x • $${totalPrice?.toFixed(2) || '0.00'} • ${status}`,
      }
    },
  },
}
