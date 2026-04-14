import mongoose from 'mongoose';

const ownerRequestSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  type: {
    type: String,
    enum: ['complaint', 'technical_issue', 'billing', 'feature_request', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'rejected'],
    default: 'open'
  },
  adminResponse: {
    type: String
  },
  ownerResponse: {
    type: String
  },
  ownerAttachment: {
    type: String // We will store base64 or URL
  },
  resolvedAt: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model('OwnerRequest', ownerRequestSchema);
