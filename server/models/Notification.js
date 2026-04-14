import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  // Who receives this notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Student', 'Owner', 'Admin']
  },
  // Notification metadata
  type: {
    type: String,
    required: true,
    enum: [
      'complaint_raised',
      'complaint_update',
      'complaint_resolved',
      'complaint_escalated',
      'complaint_admin_action',
      'booking_new',
      'booking_confirmed',
      'booking_rejected',
      'payment_success',
      'payment_refund',
      'general'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  // Related entity for navigation
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedType: {
    type: String,
    enum: ['complaint', 'booking', 'payment', 'hostel', 'owner_request', null]
  },
  // State
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for fast queries
NotificationSchema.index({ recipient: 1, recipientModel: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', NotificationSchema);
