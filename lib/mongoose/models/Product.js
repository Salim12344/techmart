// lib/mongoose/models/Product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  category: {
    type: String,
    enum: ['iPhone', 'iPad', 'Mac', 'Apple Watch', 'AirPods', 'Apple TV', 'Accessories'],
    required: true,
  },
  description: {
    type: String,
  },
  specs: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  warranty: {
    type: String,
  },
  tags: {
    type: [String],
    enum: ['New', 'Trending', 'Top Rated'],
    default: [],
  },
  colors: [
    {
      name: String,
      hex: String,
      images: [String], // Cloudinary URLs
    },
  ],
  storageOptions: [String], // e.g., ['128GB', '256GB', '512GB', '1TB']
  variants: [
    {
      color: String,
      storage: String,
      price: Number,
      stock: Number,
      sku: String,
    },
  ],
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

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
