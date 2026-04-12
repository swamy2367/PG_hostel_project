import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: [true, 'Hostel reference is required']
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room reference is required']
  },

  // Booking details
  roomType: {
    type: String,
    required: [true, 'Room type is required'],
    enum: ['single', 'double', 'triple', 'four']
  },
  roomNumber: {
    type: Number,
    required: [true, 'Room number is required']
  },
  rent: {
    type: Number,
    required: [true, 'Rent amount is required']
  },

  // Flexible duration support
  durationType: {
    type: String,
    enum: ['day', 'week', 'month'],
    default: 'month'
  },
  durationValue: {
    type: Number,
    default: 1,
    min: 1
  },
  totalPrice: {
    type: Number,
    default: 0
  },

  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'active', 'cancelled', 'completed'],
    default: 'pending'
  },

  // Dates
  requestedDate: {
    type: Date,
    default: Date.now
  },
  approvedDate: {
    type: Date
  },
  checkInDate: {
    type: Date
  },
  checkOutDate: {
    type: Date
  },

  // Payment tracking
  monthlyFee: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  paymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    method: {
      type: String
    },
    reference: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Communication
  studentNotes: {
    type: String,
    trim: true
  },
  ownerNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
BookingSchema.index({ student: 1, status: 1 });
BookingSchema.index({ hostel: 1, status: 1 });
BookingSchema.index({ room: 1 });

export default mongoose.model('Booking', BookingSchema);
