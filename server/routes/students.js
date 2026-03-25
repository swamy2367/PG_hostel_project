import express from 'express';
import Student from '../models/Student.js';
import Room from '../models/Room.js';
import Admin from '../models/Admin.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students for logged in admin
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const students = await Student.find({ admin: req.admin.id }).sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/students
// @desc    Add a new student
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('📝 Received student data:', JSON.stringify(req.body, null, 2));
    
    // Fetch admin details to get hostelName
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Set rent based on room type
    let rent = 5000; // default for 4-sharing
    if (req.body.roomType === 'double') {
      rent = 8000;
    } else if (req.body.roomType === 'triple') {
      rent = 6500;
    } else if (req.body.roomType === 'four') {
      rent = 5000;
    }

    // Correctly map admin and add server-side fields
    const studentData = { 
      ...req.body, 
      admin: req.admin.id,
      hostelName: admin.hostelName,
      rent: rent
    };
    
    // Check if student ID already exists
    const existing = await Student.findOne({ studentId: studentData.studentId, admin: req.admin.id });
    if (existing) {
      console.log('❌ Student ID already exists:', studentData.studentId);
      return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }

    // Create student
    console.log('Attempting to create student with data:', JSON.stringify(studentData, null, 2));
    
    const student = await Student.create(studentData);
    console.log('✅ Student created successfully:', student._id);

    // Update room occupants
    console.log(`Updating room number: ${student.roomNumber}`);
    const roomUpdate = await Room.findOneAndUpdate(
      { number: student.roomNumber, adminId: req.admin.id },
      { $push: { occupants: student._id }, status: 'occupied' },
      { new: true }
    );
    
    if (!roomUpdate) {
      console.log(`⚠️ Room not found for number: ${student.roomNumber} and adminId: ${req.admin.id}`);
    } else {
      console.log(`✅ Room ${roomUpdate.number} updated. Occupants: ${roomUpdate.occupants.length}`);
    }

    res.status(201).json({ success: true, student });
  } catch (error) {
    console.error('❌ Error adding student:');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    
    // Log validation errors specifically
    if (error.name === 'ValidationError') {
      console.error('Validation Errors:', error.errors);
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: `Validation Error: ${messages.join(', ')}` });
    }
    
    // Log the full error for debugging
    console.error('Full Error Object:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Remove a student
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ 
      _id: req.params.id, 
      admin: req.admin.id 
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Update room
    const room = await Room.findOne({ number: student.roomNumber, admin: req.admin.id });
    if (room) {
      room.occupants = room.occupants.filter(id => id.toString() !== student._id.toString());
      if (room.occupants.length === 0) {
        room.status = 'available';
      }
      await room.save();
    }

    res.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
