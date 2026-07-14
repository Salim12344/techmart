import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    category: String,
    description: String,
    image: String,
    warranty: String,
    tags: [String],
    colors: [{ name: String, hex: String, image: String, images: [String] }],
    storageOptions: [String],
    variants: [
      {
        color: String,
        storage: String,
        sku: String,
        price: Number,
        stock: Number,
      },
    ],
    specs: mongoose.Schema.Types.Mixed,
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.product || mongoose.model('product', ProductSchema);