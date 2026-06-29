import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  discountPercent: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  maxUses: {
    type: Number,
    required: true,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
