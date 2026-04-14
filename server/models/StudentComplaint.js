import mongoose from 'mongoose';

const StudentComplaintSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  category: {
    type: String,
    enum: [
      'maintenance',      // Plumbing, electrical, furniture issues
      'cleanliness',      // Room/common area cleanliness
      'food',             // Mess/food quality issues
      'wifi_internet',    // Internet connectivity problems
      'water_supply',     // Water availability issues
      'electricity',      // Power cuts, electrical problems
      'security',         // Safety concerns
      'noise',            // Noise disturbance
      'roommate',         // Roommate issues
      'staff_behavior',   // Staff conduct issues
      'billing',          // Payment/billing disputes
      'amenities',        // Missing/broken amenities
      'other'             // Other issues
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: 2000
  },
  attachments: [{
    type: String // URLs to images if any
  }],
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'reopened', 'escalated'],
    default: 'open'
  },
  ownerResponse: {
    type: String,
    trim: true
  },
  resolution: {
    type: String,
    trim: true
  },
  resolvedAt: {
    type: Date
  },
  // Escalation fields
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalationReason: {
    type: String,
    enum: ['financial_issue', 'payment_dispute', 'system_issue', 'user_conflict', 'other', null],
    default: null
  },
  escalationNote: {
    type: String,
    trim: true
  },
  escalatedAt: {
    type: Date
  },
  adminResponse: {
    type: String,
    trim: true
  },
  adminAction: {
    type: String,
    enum: ['resolved', 'rejected', 'more_info', null],
    default: null
  },
  adminActionAt: {
    type: Date
  },
  studentRating: {
    type: Number,
    min: 1,
    max: 5
  },
  studentFeedback: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
StudentComplaintSchema.index({ student: 1, status: 1 });
StudentComplaintSchema.index({ owner: 1, status: 1 });
StudentComplaintSchema.index({ hostel: 1, status: 1 });
StudentComplaintSchema.index({ createdAt: -1 });

export default mongoose.model('StudentComplaint', StudentComplaintSchema);
