// models/OTPToken.js
import mongoose from 'mongoose';

const OTPTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // optional — only set after user is created
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['SIGNUP_VERIFY', 'LOGIN_2FA', 'PASSWORD_CHANGE', 'EMAIL_CHANGE_OLD', 'EMAIL_CHANGE_NEW'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lockedUntil: Date,
  requestCount: {
    type: Number,
    default: 1,
  },
  lastRequestAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-delete expired OTPs after 6 hours
OTPTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 21600 });

export default mongoose.models.OTPToken || mongoose.model('OTPToken', OTPTokenSchema);
