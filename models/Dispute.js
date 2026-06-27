// lib/mongoose/models/Dispute.js
import mongoose from 'mongoose';

const DisputeSchema = new mongoose.Schema({
  orderNumber: String,
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'order',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    enum: ['ITEM_NOT_RECEIVED', 'WRONG_ITEM', 'ITEM_DAMAGED', 'CHANGE_OF_MIND'],
    required: true,
  },
  description: String,
  photoUrl: String,
  status: {
    type: String,
    enum: ['OPEN', 'APPROVED', 'REJECTED'],
    default: 'OPEN',
  },
  adminNote: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Dispute || mongoose.model('Dispute', DisputeSchema);
