// lib/mongoose/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    default: null, // null for social login users
  },
  phone: {
    type: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  provider: {
    type: String,
    enum: ['email', 'google', 'apple'],
    default: 'email',
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  pendingEmail: {
    type: String,
    default: null,
  },
  passwordChangedAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
