import express from 'express';
import jwt from 'jsonwebtoken';
import StudentComplaint from '../models/StudentComplaint.js';
import Booking from '../models/Booking.js';
import Student from '../models/Student.js';
import Owner from '../models/Owner.js';
import Hostel from '../models/Hostel.js';
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

// Helper: get all students with active bookings at a hostel
async function getHostelStudents(hostelId, excludeStudent = null) {
  const bookings = await Booking.find({
    hostel: hostelId,
    status: { $in: ['approved', 'active', 'confirmed', 'pending_confirmation'] }
  }).select('student');
  const studentIds = [...new Set(bookings.map(b => b.student.toString()))];
  return studentIds.filter(id => id !== excludeStudent?.toString());
}

// ==================== STUDENT ROUTES ====================

// @route   POST /api/complaints
// @desc    Create a new complaint (Student only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.userRole !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can create complaints' });
    }

    const { hostelId, category, priority, subject, description, attachments } = req.body;

    // Verify student has an active booking at this hostel
    const activeBooking = await Booking.findOne({
      student: req.userId,
      hostel: hostelId,
      status: { $in: ['approved', 'active', 'checked_in', 'confirmed', 'pending_confirmation'] }
    }).populate('hostel', 'owner name');

    if (!activeBooking) {
      return res.status(403).json({
        success: false,
        message: 'You can only raise complaints for hostels where you have an active booking'
      });
    }

    const complaint = new StudentComplaint({
      student: req.userId,
      hostel: hostelId,
      owner: activeBooking.hostel.owner,
      booking: activeBooking._id,
      room: activeBooking.room,
      category,
      priority: priority || 'medium',
      subject,
      description,
      attachments: attachments || []
    });

    await complaint.save();

    // Get student name for notification
    const student = await Student.findById(req.userId, 'name');
    const studentName = student?.name || 'A student';
    const hostelName = activeBooking.hostel?.name || 'your hostel';

    // Notify owner
    await createNotification({
      recipientId: activeBooking.hostel.owner,
      recipientModel: 'Owner',
      type: 'complaint_raised',
      title: 'New Complaint Raised',
      message: `${studentName} raised a complaint: "${subject}" at ${hostelName}`,
      relatedId: complaint._id,
      relatedType: 'complaint',
    });

    // Notify all other students at the same hostel
    const hostelStudents = await getHostelStudents(hostelId, req.userId);
    if (hostelStudents.length > 0) {
      await createBulkNotifications(
        hostelStudents.map(id => ({ id, model: 'Student' })),
        {
          type: 'complaint_raised',
          title: 'New Complaint at Your Hostel',
          message: `${studentName} raised a complaint: "${subject}"`,
          relatedId: complaint._id,
          relatedType: 'complaint',
        }
      );
    }

    res.status(201).json({ success: true, message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ success: false, message: 'Failed to create complaint' });
  }
});

// @route   GET /api/complaints/my
// @desc    Get student's complaints
router.get('/my', auth, async (req, res) => {
  try {
    if (req.userRole !== 'student') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { status } = req.query;
    const filter = { student: req.userId };
    if (status && status !== 'all') filter.status = status;

    const complaints = await StudentComplaint.find(filter)
      .populate('hostel', 'name')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (error) {
    console.error('Get student complaints error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// @route   GET /api/complaints/hostel/:hostelId
// @desc    Get complaints for a hostel (visible to all users of that hostel)
router.get('/hostel/:hostelId', auth, async (req, res) => {
  try {
    const hostelId = req.params.hostelId;

    // Verify user is associated with this hostel
    if (req.userRole === 'student') {
      const hasBooking = await Booking.findOne({
        student: req.userId, hostel: hostelId,
        status: { $in: ['approved', 'active', 'confirmed', 'pending_confirmation'] }
      });
      if (!hasBooking) return res.status(403).json({ success: false, message: 'Access denied' });
    } else if (req.userRole === 'owner') {
      const hostel = await Hostel.findOne({ _id: hostelId, owner: req.userId });
      if (!hostel) return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const complaints = await StudentComplaint.find({ hostel: hostelId })
      .populate('student', 'name')
      .populate('room', 'roomNumber')
      .sort({ createdAt: -1 });

    res.json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get single complaint details
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await StudentComplaint.findById(req.params.id)
      .populate('student', 'name email phone')
      .populate('hostel', 'name address')
      .populate('room', 'roomNumber type')
      .populate('owner', 'name');

    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });

    // Check access
    const isStudent = req.userRole === 'student' && complaint.student._id.toString() === req.userId;
    const isOwner = req.userRole === 'owner' && complaint.owner._id.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isStudent && !isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaint' });
  }
});

// @route   PUT /api/complaints/:id/feedback
// @desc    Student gives feedback after resolution
router.put('/:id/feedback', auth, async (req, res) => {
  try {
    if (req.userRole !== 'student') return res.status(403).json({ success: false, message: 'Only students' });
    const { rating, feedback } = req.body;
    const complaint = await StudentComplaint.findOne({ _id: req.params.id, student: req.userId, status: 'resolved' });
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found or not resolved' });

    complaint.studentRating = rating;
    complaint.studentFeedback = feedback;
    complaint.status = 'closed';
    await complaint.save();

    res.json({ success: true, message: 'Feedback submitted', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
});

// @route   PUT /api/complaints/:id/reopen
// @desc    Student reopens a resolved complaint
router.put('/:id/reopen', auth, async (req, res) => {
  try {
    if (req.userRole !== 'student') return res.status(403).json({ success: false, message: 'Only students' });
    const { reason } = req.body;
    const complaint = await StudentComplaint.findOne({
      _id: req.params.id, student: req.userId, status: { $in: ['resolved', 'closed'] }
    });
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });

    complaint.status = 'reopened';
    complaint.description += `\n\n--- Reopened ---\n${reason}`;
    complaint.resolution = null;
    complaint.resolvedAt = null;
    await complaint.save();

    // Notify owner
    await createNotification({
      recipientId: complaint.owner,
      recipientModel: 'Owner',
      type: 'complaint_update',
      title: 'Complaint Reopened',
      message: `A complaint has been reopened: "${complaint.subject}"`,
      relatedId: complaint._id,
      relatedType: 'complaint',
    });

    res.json({ success: true, message: 'Complaint reopened', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reopen complaint' });
  }
});

// ==================== OWNER ROUTES ====================

// @route   GET /api/complaints/owner/all
// @desc    Get all complaints for owner's hostels
router.get('/owner/all', auth, async (req, res) => {
  try {
    if (req.userRole !== 'owner') return res.status(403).json({ success: false, message: 'Access denied' });

    const { status, hostelId, priority } = req.query;
    const filter = { owner: req.userId };
    if (status && status !== 'all') filter.status = status;
    if (hostelId) filter.hostel = hostelId;
    if (priority && priority !== 'all') filter.priority = priority;

    const complaints = await StudentComplaint.find(filter)
      .populate('student', 'name email phone')
      .populate('hostel', 'name')
      .populate('room', 'roomNumber type')
      .sort({ priority: -1, createdAt: -1 });

    const statusCounts = await StudentComplaint.aggregate([
      { $match: { owner: req.userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const counts = { all: 0, open: 0, in_progress: 0, resolved: 0, closed: 0, reopened: 0, escalated: 0 };
    statusCounts.forEach(s => { counts[s._id] = s.count; counts.all += s.count; });

    res.json({ success: true, complaints, counts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
});

// @route   PUT /api/complaints/owner/:id/respond
// @desc    Owner responds to a complaint
router.put('/owner/:id/respond', auth, async (req, res) => {
  try {
    if (req.userRole !== 'owner') return res.status(403).json({ success: false, message: 'Only owners' });
    const { response, status } = req.body;

    const complaint = await StudentComplaint.findOne({ _id: req.params.id, owner: req.userId });
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });

    complaint.ownerResponse = response;
    if (status) complaint.status = status;
    else if (complaint.status === 'open') complaint.status = 'in_progress';
    await complaint.save();

    // Notify the student who raised the complaint
    await createNotification({
      recipientId: complaint.student,
      recipientModel: 'Student',
      type: 'complaint_update',
      title: 'Complaint Updated',
      message: `Your complaint "${complaint.subject}" has been updated to: ${complaint.status.replace('_', ' ')}`,
      relatedId: complaint._id,
      relatedType: 'complaint',
    });

    // Notify other students in the hostel
    const hostelStudents = await getHostelStudents(complaint.hostel, complaint.student);
    if (hostelStudents.length > 0) {
      await createBulkNotifications(
        hostelStudents.map(id => ({ id, model: 'Student' })),
        {
          type: 'complaint_update',
          title: 'Complaint Update',
          message: `Complaint "${complaint.subject}" status: ${complaint.status.replace('_', ' ')}`,
          relatedId: complaint._id,
          relatedType: 'complaint',
        }
      );
    }

    res.json({ success: true, message: 'Response added', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to respond' });
  }
});

// @route   PUT /api/complaints/owner/:id/resolve
// @desc    Owner resolves a complaint
router.put('/owner/:id/resolve', auth, async (req, res) => {
  try {
    if (req.userRole !== 'owner') return res.status(403).json({ success: false, message: 'Only owners' });
    const { resolution } = req.body;

    const complaint = await StudentComplaint.findOne({ _id: req.params.id, owner: req.userId });
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });

    complaint.resolution = resolution;
    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    await complaint.save();

    // Notify student
    await createNotification({
      recipientId: complaint.student,
      recipientModel: 'Student',
      type: 'complaint_resolved',
      title: 'Complaint Resolved ✅',
      message: `Your complaint "${complaint.subject}" has been resolved.`,
      relatedId: complaint._id,
      relatedType: 'complaint',
    });

    // Notify other hostel students
    const hostelStudents = await getHostelStudents(complaint.hostel, complaint.student);
    if (hostelStudents.length > 0) {
      await createBulkNotifications(
        hostelStudents.map(id => ({ id, model: 'Student' })),
        {
          type: 'complaint_resolved',
          title: 'Complaint Resolved',
          message: `Complaint "${complaint.subject}" has been resolved.`,
          relatedId: complaint._id,
          relatedType: 'complaint',
        }
      );
    }

    res.json({ success: true, message: 'Complaint resolved', complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resolve' });
  }
});

// @route   PUT /api/complaints/owner/:id/escalate
// @desc    Owner escalates a complaint to admin
router.put('/owner/:id/escalate', auth, async (req, res) => {
  try {
    if (req.userRole !== 'owner') return res.status(403).json({ success: false, message: 'Only owners' });
    const { reason, note } = req.body;

    const complaint = await StudentComplaint.findOne({ _id: req.params.id, owner: req.userId })
      .populate('hostel', 'name');
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });
    if (complaint.isEscalated) return res.status(400).json({ success: false, message: 'Already escalated' });

    complaint.isEscalated = true;
    complaint.escalationReason = reason || 'other';
    complaint.escalationNote = note || '';
    complaint.escalatedAt = new Date();
    complaint.status = 'escalated';
    await complaint.save();

    // Notify all admins
    const admins = await Admin.find({}, '_id');
    if (admins.length > 0) {
      await createBulkNotifications(
        admins.map(a => ({ id: a._id, model: 'Admin' })),
        {
          type: 'complaint_escalated',
          title: 'Complaint Escalated ⚠️',
          message: `Owner escalated complaint "${complaint.subject}" at ${complaint.hostel?.name || 'hostel'}: ${reason}`,
          relatedId: complaint._id,
          relatedType: 'complaint',
        }
      );
    }

    // Notify student that escalated
    await createNotification({
      recipientId: complaint.student,
      recipientModel: 'Student',
      type: 'complaint_escalated',
      title: 'Complaint Escalated',
      message: `Your complaint "${complaint.subject}" has been escalated to administration.`,
      relatedId: complaint._id,
      relatedType: 'complaint',
    });

    res.json({ success: true, message: 'Complaint escalated to admin', complaint });
  } catch (error) {
    console.error('Escalate error:', error);
    res.status(500).json({ success: false, message: 'Failed to escalate' });
  }
});

// @route   GET /api/complaints/owner/stats
// @desc    Complaint statistics for owner
router.get('/owner/stats', auth, async (req, res) => {
  try {
    if (req.userRole !== 'owner') return res.status(403).json({ success: false, message: 'Access denied' });

    const stats = await StudentComplaint.aggregate([
      { $match: { owner: req.userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          in_progress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          reopened: { $sum: { $cond: [{ $eq: ['$status', 'reopened'] }, 1, 0] } },
          escalated: { $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } },
          avgRating: { $avg: '$studentRating' }
        }
      }
    ]);

    const categoryStats = await StudentComplaint.aggregate([
      { $match: { owner: req.userId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      stats: stats[0] || { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0, reopened: 0, escalated: 0, avgRating: null },
      topCategories: categoryStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ==================== ADMIN ROUTES ====================

// @route   GET /api/complaints/admin/escalated
// @desc    Get all escalated complaints (admin only)
router.get('/admin/escalated', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const { hostelId, ownerId, status } = req.query;
    const filter = { isEscalated: true };
    if (hostelId) filter.hostel = hostelId;
    if (ownerId) filter.owner = ownerId;
    if (status && status !== 'all') filter.status = status;

    const complaints = await StudentComplaint.find(filter)
      .populate('student', 'name email phone')
      .populate('hostel', 'name city')
      .populate('owner', 'name email')
      .populate('room', 'roomNumber type')
      .sort({ escalatedAt: -1 });

    res.json({ success: true, complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch escalated complaints' });
  }
});

// @route   PUT /api/complaints/admin/:id/action
// @desc    Admin takes action on an escalated complaint
router.put('/admin/:id/action', auth, async (req, res) => {
  try {
    if (req.userRole !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const { action, response } = req.body; // action: 'resolved' | 'rejected' | 'more_info'

    const complaint = await StudentComplaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Not found' });
    if (!complaint.isEscalated) return res.status(400).json({ success: false, message: 'Not escalated' });

    complaint.adminAction = action;
    complaint.adminResponse = response || '';
    complaint.adminActionAt = new Date();
    if (action === 'resolved') {
      complaint.status = 'resolved';
      complaint.resolvedAt = new Date();
    }
    await complaint.save();

    const actionLabel = action === 'resolved' ? 'resolved' : action === 'rejected' ? 'rejected the escalation for' : 'requested more info on';

    // Notify owner
    await createNotification({
      recipientId: complaint.owner,
      recipientModel: 'Owner',
      type: 'complaint_admin_action',
      title: `Admin ${action === 'resolved' ? 'Resolved' : action === 'rejected' ? 'Rejected' : 'Responded'}`,
      message: `Admin has ${actionLabel} complaint "${complaint.subject}"`,
      relatedId: complaint._id,
      relatedType: 'complaint',
    });

    // Notify student
    await createNotification({
      recipientId: complaint.student,
      recipientModel: 'Student',
      type: 'complaint_admin_action',
      title: `Complaint ${action === 'resolved' ? 'Resolved by Admin' : 'Updated'}`,
      message: `Your escalated complaint "${complaint.subject}" — admin action: ${action.replace('_', ' ')}`,
      relatedId: complaint._id,
      relatedType: 'complaint',
    });

    res.json({ success: true, message: `Complaint ${action}`, complaint });
  } catch (error) {
    console.error('Admin action error:', error);
    res.status(500).json({ success: false, message: 'Failed to process action' });
  }
});

export default router;
