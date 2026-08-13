import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Admin',
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide admin phone number'],
      unique: true,
    },
    email: {
      type: String,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
    },
    role: {
      type: String,
      default: 'admin',
    },
    resetOtp: {
      type: String,
      default: '',
    },
    resetOtpExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password if modified
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$') && !this.password.startsWith('$2y$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$')) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
  return candidatePassword === this.password;
};

const adminModel = mongoose.models.admin || mongoose.model('admin', adminSchema);

export const seedDefaultAdmin = async () => {
  try {
    const adminCount = await adminModel.countDocuments();
    if (adminCount === 0) {
      const defaultPhone = process.env.ADMIN_PHONE || '9876543210';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(defaultPassword, salt);

      await adminModel.create({
        name: 'Super Admin',
        phone: defaultPhone,
        email: 'admin@agriindia.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`[Admin Seed] Default Admin created in database with phone: ${defaultPhone}`);
    }
  } catch (err) {
    console.error('[Admin Seed Error]:', err.message);
  }
};

export default adminModel;
