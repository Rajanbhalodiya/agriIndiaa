import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {type: String, required: true},
    advisorId: {type: String, required: true},
    slotDate: {type: String, required: true},
    slotTime: {type: String, required: true},
    userData: {type: Object, required: true},
    advisorData: {type: Object, required: true},
    amount: {type: Number, required: true},
    date: {type: Number, required: true},
    cancelled: {type: Boolean, default: false},
    payment: {type: Boolean, default: false},
    paymentDate: {type: Number},
    paymentMethod: {type: String, default: 'Online'},
    isCompleted: {type: Boolean, default: false}
})

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema)

export default orderModel
