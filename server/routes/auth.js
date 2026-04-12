import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Owner from '../models/Owner.js';
import Student from '../models/Student.js';
import Otp from '../models/Otp.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ─── Email Transporter (lazy init) ───────────────────────────────────
let _emailTransporter = null;
function getEmailTransporter() {
  if (_emailTransporter) return _emailTransporter;
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    _emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    console.log(`📧 Email transporter configured for: ${process.env.EMAIL_USER}`);
    return _emailTransporter;
  }
  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOtpEmail(email, otp) {
  const transporter = getEmailTransporter();
  if (!transporter) {
    console.log(`📧 [DEV] Email transporter not configured. OTP for ${email}: ${otp}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `HostelHub <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your HostelHub Verification Code',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #4f46e5; margin-bottom: 0.5rem;">HostelHub</h2>
        <p style="color: #525252; margin-bottom: 1.5rem;">Your verification code is:</p>
        <div style="background: #f5f3ff; border: 2px solid #e0e7ff; border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
          <span style="font-size: 2rem; font-weight: 700; letter-spacing: 0.3em; color: #4f46e5;">${otp}</span>
        </div>
        <p style="color: #737373; font-size: 0.875rem;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0;" />
        <p style="color: #9ca3af; font-size: 0.75rem;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 OTP sent to ${email} (messageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`📧 Email send FAILED to ${email}:`, error.message);
    return false;
  }
}

// ─── OTP ROUTES ──────────────────────────────────────────────────────

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email for registration verification
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required',
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Check if email already registered
    if (role === 'student') {
      const existing = await Student.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }
    } else if (role === 'owner') {
      const existing = await Owner.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }
    }

    // Cooldown: check if OTP was sent recently (within last 30 seconds)
    const recentOtp = await Otp.findOne({
      email: email.toLowerCase(),
      role,
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) },
    });

    if (recentOtp) {
      const waitSeconds = Math.ceil(
        (30 * 1000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000
      );
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP`,
      });
    }

    // Generate OTP
    const emailOtp = generateOtp();

    // Delete any previous OTP for this email+role combo
    await Otp.deleteMany({ email: email.toLowerCase(), role });

    // Store OTP (expires in 5 minutes)
    await Otp.create({
      email: email.toLowerCase(),
      phone: 'N/A',
      emailOtp,
      phoneOtp: 'N/A',
      role,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send OTP via email
    const emailSent = await sendOtpEmail(email, emailOtp);

    console.log(`🔑 OTP generated for ${email}: ${emailOtp}`);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      emailSent,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify email OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, emailOtp, role } = req.body;

    if (!email || !emailOtp || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and role are required',
      });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      role,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.',
      });
    }

    // Check expiry
    if (otpRecord.expiresAt < new Date()) {
      await otpRecord.deleteOne();
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Check attempts (max 5)
    if (otpRecord.attempts >= 5) {
      await otpRecord.deleteOne();
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (otpRecord.emailOtp !== emailOtp.trim()) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      });
    }

    // Verified — mark the OTP record
    otpRecord.emailVerified = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.',
    });
  }
});

// ─── REGISTRATION ROUTES ─────────────────────────────────────────────

// @route   POST /api/auth/owner/register
// @desc    Register a new owner (requires email OTP verification)
// @access  Public
router.post('/owner/register', async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const existingOwner = await Owner.findOne({ $or: [{ email }, { username }] });
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: 'Owner with this email or username already exists',
      });
    }

    // Check email OTP verification
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      role: 'owner',
      emailVerified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before registering',
      });
    }

    await otpRecord.deleteOne();

    const owner = await Owner.create({
      username,
      email,
      password,
      phone,
      role: 'owner',
      isEmailVerified: true,
    });

    const token = jwt.sign(
      { id: owner._id, role: 'owner', email: owner.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: owner._id,
        username: owner.username,
        email: owner.email,
        role: 'owner',
      },
    });
  } catch (error) {
    console.error('Owner registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/owner/login
// @desc    Login owner
// @access  Public
router.post('/owner/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password',
      });
    }

    const owner = await Owner.findOne({ username });
    if (!owner) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!owner.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await owner.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: owner._id, role: 'owner', email: owner.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: owner._id,
        username: owner.username,
        email: owner.email,
        role: 'owner',
        hostel: owner.hostel,
      },
    });
  } catch (error) {
    console.error('Owner login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   POST /api/auth/student/register
// @desc    Register a new student (requires email OTP verification)
// @access  Public
router.post('/student/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists',
      });
    }

    // Check email OTP verification
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      role: 'student',
      emailVerified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email before registering',
      });
    }

    await otpRecord.deleteOne();

    const student = await Student.create({
      name,
      email,
      password,
      phone,
      role: 'student',
      isEmailVerified: true,
    });

    const token = jwt.sign(
      { id: student._id, role: 'student', email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Email verified.',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: 'student',
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
});

// @route   POST /api/auth/student/login
// @desc    Login student
// @access  Public
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!student.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student._id, role: 'student', email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: student._id,
        name: student.name,
        email: student.email,
        role: 'student',
        isEmailVerified: student.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const { id, role } = req.user;

    let user;
    if (role === 'owner') {
      user = await Owner.findById(id).select('-password').populate('hostel');
    } else if (role === 'student') {
      user = await Student.findById(id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: { ...user.toObject(), role },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ success: false, message: 'Authentication error' });
  }
});

export default router;
