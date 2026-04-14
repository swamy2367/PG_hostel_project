import express from 'express';
import jwt from 'jsonwebtoken';
import Notification from '../models/Notification.js';

const router = express.Router();

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Map role to model name
function roleToModel(role) {
  if (role === 'student') return 'Student';
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  return null;
}

// @route   GET /api/notifications
// @desc    Get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const model = roleToModel(req.userRole);
    if (!model) return res.status(400).json({ success: false, message: 'Invalid role' });

    const { limit = 30, skip = 0, unreadOnly } = req.query;

    const filter = { recipient: req.userId, recipientModel: model };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
      Notification.countDocuments({ recipient: req.userId, recipientModel: model, isRead: false }),
    ]);

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const model = roleToModel(req.userRole);
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId, recipientModel: model },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    const model = roleToModel(req.userRole);
    await Notification.updateMany(
      { recipient: req.userId, recipientModel: model, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

export default router;
