import mongoose from "mongoose";    

const advisorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    village: { type: String, required: true },
    email: { type: String },
    password: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    grade: { type: String },
    weight: { type: String },
    about: { type: String },
    available: { type: Boolean, default: true },
    price: { type: Number },
    address: { type: Object },
    date: { type: Date },
    slots_booked: { type: Object, default: {} }
}, { minimize: false })

const advisorModel = mongoose.models.advisor || mongoose.model('advisor', advisorSchema)

export default advisorModel
