import express from 'express';
import Student from '../models/Student.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/fees/payment
// @desc    Add payment for a student
// @access  Private
router.post('/payment', authenticate, async (req, res) => {
  try {
    const { studentId, amount, date, method, reference } = req.body;

    const student = await Student.findOne({ 
      studentId, 
      admin: req.admin.id 
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.paymentHistory.push({
      amount: parseFloat(amount),
      date: new Date(date),
      method,
      reference
    });

    student.totalPaid += parseFloat(amount);
    await student.save();

    res.json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   GET /api/fees/student/:studentId
// @desc    Get payment history for a student
// @access  Private
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const student = await Student.findOne({ 
      studentId: req.params.studentId, 
      admin: req.admin.id 
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ 
      success: true, 
      paymentHistory: student.paymentHistory,
      totalPaid: student.totalPaid,
      monthlyFee: student.rent
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

export default router;
