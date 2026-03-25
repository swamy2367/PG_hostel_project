import express from 'express';
import Room from '../models/Room.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms for logged in admin
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const rooms = await Room.find({ adminId: req.admin.id })
      .populate('occupants')
      .sort({ number: 1 });
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms/:type
// @desc    Get rooms by type
// @access  Private
router.get('/:type', authenticate, async (req, res) => {
  try {
    const type = req.params.type;
    const rooms = await Room.find({ adminId: req.admin.id, type })
      .populate('occupants')
      .sort({ number: 1 });
    res.json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update room status
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const room = await Room.findOneAndUpdate(
      { _id: req.params.id, adminId: req.admin.id },
      { status: req.body.status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
