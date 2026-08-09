import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number },
  category: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, default: 'kg' }, // Base unit, kept for backward compatibility
  packSizes: [{
    size: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  image: { type: String, required: true }, // Cloudinary URL
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true
});

const productModel = mongoose.models.product || mongoose.model('product', productSchema);

export default productModel;
