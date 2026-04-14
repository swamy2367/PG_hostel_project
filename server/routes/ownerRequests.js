import express from 'express';
import jwt from 'jsonwebtoken';
import OwnerRequest from '../models/OwnerRequest.js';
import Owner from '../models/Owner.js';
import Admin from '../models/Admin.js';
import { createNotification, createBulkNotifications } from '../utils/notifications.js';

const router = express.Router();

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// @route   POST /api/owner-requests
// @desc    Create a new request/complaint to Admin (Owner only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.userRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Only owners can create proper admin requests' });
    }

    const { type, priority, subject, description } = req.body;

    const newRequest = new OwnerRequest({
      owner: req.userId,
      type,
      priority: priority || 'medium',
      subject,
      description
    });

    await newRequest.save();

    // Get owner name for notification
    const owner = await Owner.findById(req.userId, 'name');
    const ownerName = owner?.name || 'An owner';

    // Notify all admins
    const admins = await Admin.find().select('_id');
    if (admins.length > 0) {
      await createBulkNotifications(
        admins.map(a => ({ id: a._id.toString(), model: 'Admin' })),
        {
          type: 'complaint_raised',
          title: 'New Owner Request',
          message: `${ownerName} submitted a new request: "${subject}"`,
          relatedId: newRequest._id,
          relatedType: 'owner_request',
        }
      );
    }

    res.status(201).json({ success: true, message: 'Request submitted to admin successfully', request: newRequest });
  } catch (error) {
    console.error('Create owner request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create request' });
  }
});

// @route   GET /api/owner-requests/my
// @desc    Get owner's requests
router.get('/my', auth, async (req, res) => {
  try {
    if (req.userRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const requests = await OwnerRequest.find({ owner: req.userId })
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get owner requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// @route   GET /api/owner-requests/admin
// @desc    Admin: get all owner requests
router.get('/admin', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }
    const requests = await OwnerRequest.find()
      .populate('owner', 'name email contactNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch requests' });
  }
});

// @route   PUT /api/owner-requests/admin/:id/action
// @desc    Admin: resolve, request info, or reject
router.put('/admin/:id/action', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }
    const { action, response } = req.body; // action: 'resolved', 'more_info' (mapped to in_progress), 'rejected'
    
    const request = await OwnerRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    let newStatus = action;
    if (action === 'more_info') newStatus = 'in_progress';
    if (action === 'resolved') request.resolvedAt = new Date();

    request.status = newStatus;
    if (response) request.adminResponse = response;

    await request.save();

    // Notify the owner
    const actionMap = {
      resolved: 'resolved your request',
      more_info: 'requested more information regarding your request',
      rejected: 'rejected your request'
    };

    await createNotification({
      recipientId: request.owner,
      recipientModel: 'Owner',
      type: 'complaint_admin_action',
      title: `Admin Response: ${action.replace('_', ' ').toUpperCase()}`,
      message: `Admin ${actionMap[action]} "${request.subject}"`,
      relatedId: request._id,
      relatedType: 'owner_request',
    });

    res.json({ success: true, message: `Request marked as ${action}`, request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process admin action' });
  }
});

// @route   PUT /api/owner-requests/my/:id/reply
// @desc    Owner: Provide requested info / attachment
router.put('/my/:id/reply', auth, async (req, res) => {
  try {
    if (req.userRole !== 'owner') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const request = await OwnerRequest.findOne({ _id: req.params.id, owner: req.userId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const { response, attachment } = req.body;
    if (response) request.ownerResponse = response;
    if (attachment) request.ownerAttachment = attachment;
    
    // Change status back to review/open for admin
    request.status = 'open'; 
    await request.save();

    // Notify admins
    const owner = await Owner.findById(req.userId, 'name');
    const admins = await Admin.find().select('_id');
    if (admins.length > 0) {
      await createBulkNotifications(
        admins.map(a => ({ id: a._id.toString(), model: 'Admin' })),
        {
          type: 'complaint_update',
          title: 'Owner Provided Info',
          message: `${owner?.name} updated request: "${request.subject}"`,
          relatedId: request._id,
          relatedType: 'owner_request',
        }
      );
    }

    res.json({ success: true, message: 'Information sent to admin', request });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update request' });
  }
});

export default router;
