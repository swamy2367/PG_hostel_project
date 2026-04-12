import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  emailOtp: {
    type: String,
    required: true,
  },
  phoneOtp: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'owner'],
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index — auto-deletes expired docs
  },
}, {
  timestamps: true,
});

// Index for fast lookups
OtpSchema.index({ email: 1, phone: 1, role: 1 });

export default mongoose.model('Otp', OtpSchema);
