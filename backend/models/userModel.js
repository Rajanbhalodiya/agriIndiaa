import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    farmerName: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phone: {
      type: String,
      required: [true, 'Please provide your phone number'],
      unique: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ['admin', 'advisor', 'farmer'],
      default: 'farmer',
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    village: {
      type: String,
    },
    profileImage: {
      type: String,
      default: 'default.jpg',
    },
    image: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    // Farmer specific fields
    totalLand: String,
    temporaryLand: String,
    landType: {
      type: String,
      enum: ['farm', 'open'],
    },
    winterCrop: String,
    summerCrop: String,
    rainCrop: String,
    // For Farmers: Link to their advisor
    assignedAdvisor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    advisorName: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
export default User;