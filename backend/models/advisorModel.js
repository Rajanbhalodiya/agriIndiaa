import mongoose from "mongoose";

const advisorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    area: { type: String, required: true },
    village: { type: String, required: true },
    pincode: { type: String, required: true },
    aadhar: { type: String, required: true },
    email: { type: String },
    password: { type: String, required: true },
    plainPassword: { type: String },
    passwordChangedAt: { type: Date },
    image: { type: String },
    available: { type: Boolean, default: true },
    date: { type: Date },
    location: {
        lat: { type: Number, default: 22.3072 },
        lng: { type: Number, default: 73.1812 },
        address: { type: String, default: 'Gujarat, India' },
        speed: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
        isMoving: { type: Boolean, default: false }
    },
    locationHistory: [{
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now }
    }]
}, { minimize: false })

const advisorModel = mongoose.models.advisor || mongoose.model('advisor', advisorSchema)

export default advisorModel
