import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        productName: String,
        color: String,
        storage: String,
        sku: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      country: String,
    },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'refunded'], default: 'pending' },
    confirmedAt: Date,
    totalAmount: Number,
    paymentReference: String,
    createdAt: { type: Date, default: Date.now },
    shippedAt: Date,
    deliveredAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.order || mongoose.model('order', OrderSchema);