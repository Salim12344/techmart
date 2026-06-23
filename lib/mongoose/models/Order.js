// lib/mongoose/models/Order.js
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
  },
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
  subtotal: Number,
  deliveryFee: Number,
  discountAmount: {
    type: Number,
    default: 0,
  },
  couponCode: String,
  total: Number,
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
  },
  deliveryWindow: {
    earliest: Date,
    latest: Date,
  },
  paystackReference: String,
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
