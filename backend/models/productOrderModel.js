import mongoose from "mongoose";

const productOrderSchema = new mongoose.Schema({
    advisorId: { type: String, required: true },
    farmerId: { type: String, required: true },
    items: [{
        productId: { type: String, required: true },
        name: { type: String, required: true },
        packSize: { type: String }, // e.g., '100 ml', '1 Liter'
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String }
    }],
    totalAmount: { type: Number, required: true },
    payment: { type: Boolean, default: false },
    paymentDate: { type: Number },
    paymentMethod: { type: String, default: 'Cash' },
    status: { type: String, default: 'Pending', enum: ['Pending', 'Processing', 'Completed', 'Cancelled'] },
    date: { type: Number, required: true }
}, {
    timestamps: true
});

const productOrderModel = mongoose.models.productOrder || mongoose.model('productOrder', productOrderSchema);

export default productOrderModel;
