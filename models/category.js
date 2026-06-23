// models/category.js
import mongoose from 'mongoose';

const SpecFieldSchema = new mongoose.Schema({
  key: { type: String, required: true },       // e.g. "chip", "mainCamera"
  label: { type: String, required: true },     // e.g. "Chip", "Main Camera"
  type: {
    type: String,
    enum: ['text', 'number'],
    default: 'text',
  },
  unit: { type: String, default: '' },         // e.g. "MP", "inch", "mAh"
  placeholder: { type: String, default: '' },  // e.g. "e.g. A18 Pro"
}, { _id: false });

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    specFields: [SpecFieldSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
