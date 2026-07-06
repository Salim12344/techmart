// lib/mongoose/models/Refund.js
import mongoose from 'mongoose';

const RefundSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order',
    required: true,
  },
  disputeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispute',
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSED'],
    default: 'PENDING',
  },
  paystackRefundId: String,
  processedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Refund || mongoose.model('Refund', RefundSchema);
