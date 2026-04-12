import express from 'express';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Hostel from '../models/Hostel.js';
import Student from '../models/Student.js';
import { authenticateStudent, authenticateOwner } from '../middleware/auth.js';

const router = express.Router();

// Price calculation helper
function calculatePrice(monthlyRent, durationType, durationValue) {
  if (!monthlyRent || monthlyRent <= 0 || !durationValue || durationValue <= 0) {
    return { perUnit: 0, total: 0 };
  }
  let perUnit;
  switch (durationType) {
    case 'day':
      perUnit = Math.round(monthlyRent / 30);
      break;
    case 'week':
      perUnit = Math.round((monthlyRent / 30) * 7);
      break;
    case 'month':
    default:
      perUnit = monthlyRent;
      break;
  }
  return { perUnit, total: perUnit * durationValue };
}

// @route   POST /api/bookings/calculate
// @desc    Calculate price for a flexible booking duration
// @access  Public
router.post('/calculate', async (req, res) => {
  try {
    const { hostelId, roomType, durationType, durationValue } = req.body;

    if (!hostelId || !roomType) {
      return res.status(400).json({ success: false, message: 'hostelId and roomType are required' });
    }
    if (!['day', 'week', 'month'].includes(durationType)) {
      return res.status(400).json({ success: false, message: 'durationType must be day, week, or month' });
    }
    if (!durationValue || durationValue <= 0 || !Number.isFinite(durationValue)) {
      return res.status(400).json({ success: false, message: 'durationValue must be a positive number' });
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Get rent from hostel config
    const monthlyRent = hostel.roomConfig?.[roomType]?.rent || 0;
    if (monthlyRent <= 0) {
      return res.status(400).json({ success: false, message: 'Room type not configured or has no price' });
    }

    const { perUnit, total } = calculatePrice(monthlyRent, durationType, durationValue);
    const unitLabel = durationType === 'day' ? 'day' : durationType === 'week' ? 'week' : 'month';

    res.json({
      success: true,
      breakdown: {
        monthlyRent,
        perUnit,
        durationType,
        durationValue,
        total,
        label: `Rs.${perUnit.toLocaleString()} x ${durationValue} ${unitLabel}${durationValue !== 1 ? 's' : ''}`
      }
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({ success: false, message: 'Error calculating price' });
  }
});

// @route   POST /api/bookings/request
// @desc    Create a booking request (supports flexible duration)
// @access  Private (Student only)
router.post('/request', authenticateStudent, async (req, res) => {
  try {
    const { hostelId, roomType, studentNotes, durationType = 'month', durationValue = 1 } = req.body;
    const studentId = req.user.id;

    // Get student info
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Validate duration
    if (!['day', 'week', 'month'].includes(durationType)) {
      return res.status(400).json({ success: false, message: 'Invalid duration type' });
    }
    if (!durationValue || durationValue <= 0 || durationValue > 365) {
      return res.status(400).json({ success: false, message: 'Duration value must be between 1 and 365' });
    }

    // Check if student already has an active booking
    const existingBooking = await Booking.findOne({
      student: studentId,
      status: { $in: ['pending', 'approved', 'active'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active booking request. Please cancel it first.'
      });
    }

    // Find hostel
    const hostel = await Hostel.findById(hostelId);
    if (!hostel || !hostel.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found or inactive'
      });
    }

    // Validate room type
    if (!['single', 'double', 'triple', 'four'].includes(roomType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid room type'
      });
    }

    // Find available room
    const rooms = await Room.find({ hostelId, type: roomType }).sort({ number: 1 });
    let availableRoom = null;
    for (const room of rooms) {
      const totalAssigned = (room.occupants?.length || 0) + (room.currentBookings?.length || 0);
      if (totalAssigned < room.capacity) {
        availableRoom = room;
        break;
      }
    }

    if (!availableRoom) {
      return res.status(400).json({
        success: false,
        message: `No beds available in ${roomType} sharing rooms at this hostel`
      });
    }

    // Get rent and calculate total price
    const rent = availableRoom.rent || hostel.roomConfig[roomType]?.rent || 0;
    const { total: totalPrice } = calculatePrice(rent, durationType, durationValue);

    // Create booking with duration info
    const booking = await Booking.create({
      student: studentId,
      hostel: hostelId,
      room: availableRoom._id,
      roomType,
      roomNumber: availableRoom.number,
      rent,
      durationType,
      durationValue,
      totalPrice,
      status: 'pending',
      studentNotes: studentNotes || ''
    });

    // Add booking to room's current bookings
    availableRoom.currentBookings.push(booking._id);
    await availableRoom.save();

    // Populate and return
    await booking.populate(['hostel', 'room']);

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      booking
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking request',
      error: error.message
    });
  }
});

// @route   GET /api/bookings/my
// @desc    Get student's bookings
// @access  Private (Student only)
router.get('/my', authenticateStudent, async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user.id })
      .populate('hostel', 'name city address contactPhone')
      .populate('room', 'number type')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Get student bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking request
// @access  Private (Student only)
router.put('/:id/cancel', authenticateStudent, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership - compare as strings
    if (booking.student.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    // Can only cancel pending or approved bookings
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending or approved bookings'
      });
    }

    const wasApproved = booking.status === 'approved';
    
    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Update room - remove booking and occupant if was approved
    const room = await Room.findById(booking.room);
    if (room) {
      room.currentBookings = room.currentBookings.filter(
        b => b.toString() !== booking._id.toString()
      );
      
      // If booking was approved, remove student from occupants
      if (wasApproved) {
        room.occupants = room.occupants.filter(
          o => o.toString() !== booking.student.toString()
        );
      }
      
      // Update status based on occupancy
      if (room.occupants.length === 0) {
        room.status = 'available';
      }
      
      await room.save();
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
});

// @route   GET /api/bookings/owner/all
// @desc    Get all bookings across all owner's hostels
// @access  Private (Owner only)
// NOTE: This route must be defined BEFORE /hostel/:hostelId/* routes to avoid conflicts
router.get('/owner/all', authenticateOwner, async (req, res) => {
  try {
    // Get all hostels owned by this owner
    const hostels = await Hostel.find({ owner: req.user.id }).select('_id name');
    const hostelIds = hostels.map(h => h._id);

    if (hostelIds.length === 0) {
      return res.json({
        success: true,
        bookings: [],
        summary: { pending: 0, approved: 0, active: 0, rejected: 0, cancelled: 0 }
      });
    }

    // Get all bookings for these hostels
    const bookings = await Booking.find({
      hostel: { $in: hostelIds }
    })
      .populate('student', 'name email phone course year photo')
      .populate('hostel', 'name city')
      .populate('room', 'number type')
      .sort({ createdAt: -1 });

    // Calculate summary by status
    const summary = {
      pending: bookings.filter(b => b.status === 'pending').length,
      approved: bookings.filter(b => b.status === 'approved').length,
      active: bookings.filter(b => b.status === 'active').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length
    };

    res.json({
      success: true,
      bookings,
      summary
    });

  } catch (error) {
    console.error('Get all owner bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// @route   GET /api/bookings/hostel/:hostelId/pending
// @desc    Get pending booking requests for a hostel
// @access  Private (Owner only)
router.get('/hostel/:hostelId/pending', authenticateOwner, async (req, res) => {
  try {
    const { hostelId } = req.params;

    // Verify hostel ownership
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this hostel'
      });
    }

    // Get pending bookings
    const bookings = await Booking.find({
      hostel: hostelId,
      status: 'pending'
    })
      .populate('student', 'name email phone course year photo')
      .populate('room', 'number type')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending bookings',
      error: error.message
    });
  }
});

// @route   GET /api/bookings/hostel/:hostelId/active
// @desc    Get active bookings for a hostel
// @access  Private (Owner only)
router.get('/hostel/:hostelId/active', authenticateOwner, async (req, res) => {
  try {
    const { hostelId } = req.params;

    // Verify hostel ownership
    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view bookings for this hostel'
      });
    }

    // Get active bookings
    const bookings = await Booking.find({
      hostel: hostelId,
      status: { $in: ['approved', 'active'] }
    })
      .populate('student', 'name email phone course year photo address emergencyContact')
      .populate('room', 'number type capacity')
      .sort({ checkInDate: -1 });

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Get active bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active bookings',
      error: error.message
    });
  }
});

// @route   PUT /api/bookings/:id/approve
// @desc    Approve a booking request
// @access  Private (Owner only)
router.put('/:id/approve', authenticateOwner, async (req, res) => {
  try {
    const { ownerNotes, checkInDate } = req.body;

    const booking = await Booking.findById(req.params.id).populate('hostel');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership - compare as strings to handle ObjectId vs string
    const hostelOwnerId = booking.hostel.owner.toString();
    const currentUserId = req.user.id.toString();
    
    if (hostelOwnerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this booking'
      });
    }

    // Can only approve pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only approve pending bookings'
      });
    }

    // Update booking
    booking.status = 'approved';
    booking.approvedDate = Date.now();
    booking.checkInDate = checkInDate || Date.now();
    booking.ownerNotes = ownerNotes || '';
    await booking.save();

    // Update room - add student to occupants and remove from pending bookings
    const room = await Room.findById(booking.room);
    if (room) {
      // Remove from currentBookings (pending list)
      room.currentBookings = room.currentBookings.filter(
        b => b.toString() !== booking._id.toString()
      );
      // Add to occupants
      room.occupants.push(booking.student);
      // Only mark as occupied if room is at full capacity
      if (room.occupants.length >= room.capacity) {
        room.status = 'occupied';
      } else {
        room.status = 'available'; // Still has beds available
      }
      await room.save();
    }

    // Populate for response
    await booking.populate('student', 'name email phone');

    res.json({
      success: true,
      message: 'Booking approved successfully',
      booking
    });

  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving booking',
      error: error.message
    });
  }
});

// @route   PUT /api/bookings/:id/reject
// @desc    Reject a booking request
// @access  Private (Owner only)
router.put('/:id/reject', authenticateOwner, async (req, res) => {
  try {
    const { ownerNotes } = req.body;

    const booking = await Booking.findById(req.params.id).populate('hostel');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership - compare as strings
    const hostelOwnerId = booking.hostel.owner.toString();
    const currentUserId = req.user.id.toString();
    
    if (hostelOwnerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this booking'
      });
    }

    // Can only reject pending bookings
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject pending bookings'
      });
    }

    // Update booking
    booking.status = 'rejected';
    booking.ownerNotes = ownerNotes || 'Booking request rejected';
    await booking.save();

    // Free up the room
    await Room.findByIdAndUpdate(booking.room, {
      status: 'available',
      $pull: { currentBookings: booking._id }
    });

    res.json({
      success: true,
      message: 'Booking rejected',
      booking
    });

  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting booking',
      error: error.message
    });
  }
});

// @route   PUT /api/bookings/:id/checkout
// @desc    Check out a booking (complete the stay)
// @access  Private (Owner only)
router.put('/:id/checkout', authenticateOwner, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('hostel');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify ownership - compare as strings
    const hostelOwnerId = booking.hostel.owner.toString();
    const currentUserId = req.user.id.toString();
    
    if (hostelOwnerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Can only checkout active/approved bookings
    if (!['active', 'approved'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Can only checkout active bookings'
      });
    }

    // Update booking
    booking.status = 'completed';
    booking.checkOutDate = new Date();
    await booking.save();

    // Free up room - remove student from occupants
    const room = await Room.findById(booking.room);
    if (room) {
      room.currentBookings = room.currentBookings.filter(
        b => b.toString() !== booking._id.toString()
      );
      room.occupants = room.occupants.filter(
        o => o.toString() !== booking.student.toString()
      );
      
      // Update status if room is now empty
      if (room.occupants.length === 0) {
        room.status = 'available';
      }
      
      await room.save();
    }

    res.json({
      success: true,
      message: 'Checkout completed successfully',
      booking
    });

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing checkout',
      error: error.message
    });
  }
});

export default router;
