import mongoose from 'mongoose';

console.log('--- LOADING LATEST Student.js MODEL ---');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    type: String,
    trim: true
  },
  course: String,
  year: String,
  gender: String,
  dob: {
    type: Date,
    default: null
  },
  emergencyContact: {
    name: String,
    phone: String
  },
  notes: String,
  photo: { type: String, default: null }, // Storing as base64 string
  roomType: { 
    type: String, 
    required: true,
    enum: ['single', 'double', 'triple', 'four'] 
  },
  roomNumber: { type: Number, required: true },
  hostelName: { type: String, required: true },
  rent: { type: Number, default: 5000 },
  monthlyFee: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  paymentHistory: [{
    amount: Number,
    date: Date,
    method: String,
    reference: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Student', StudentSchema);
