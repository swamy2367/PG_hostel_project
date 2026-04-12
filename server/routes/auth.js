import express from 'express';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import Owner from '../models/Owner.js';
import Student from '../models/Student.js';
import Otp from '../models/Otp.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ─── Email Transporter ───────────────────────────────────────────────
let emailTransporter;
if (process.env.EMAIL_SERVICE) {
  emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

async function sendOtpEmail(email, otp) {
  if (!emailTransporter) {
    console.log(`📧 [DEV] Email OTP for ${email}: ${otp}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'HostelHub <noreply@hostelhub.com>',
    to: email,
    subject: 'Your HostelHub Verification Code',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
        <h2 style="color: #4f46e5; margin-bottom: 0.5rem;">HostelHub</h2>
        <p style="color: #525252; margin-bottom: 1.5rem;">Your email verification code is:</p>
        <div style="background: #f5f3ff; border: 2px solid #e0e7ff; border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
          <span style="font-size: 2rem; font-weight: 700; letter-spacing: 0.3em; color: #4f46e5;">${otp}</span>
        </div>
        <p style="color: #737373; font-size: 0.875rem;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error.message);
    return false;
  }
}

async function sendOtpSms(phone, otp) {
  // In production, integrate Twilio / MSG91 / Fast2SMS etc.
  // For development, log to console.
  console.log(`📱 [DEV] SMS OTP for ${phone}: ${otp}`);
  return true;
}

// ─── OTP ROUTES ──────────────────────────────────────────────────────

// @route   POST /api/auth/send-otp
// @desc    Send OTPs to email and phone for registration verification
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone, role } = req.body;

    if (!email || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, phone, and role are required',
      });
    }

    // Validate email format
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate phone format (Indian 10-digit)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number. Please enter a 10-digit number.',
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
      phone: cleanPhone,
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

    // Generate OTPs
    const emailOtp = generateOtp();
    const phoneOtp = generateOtp();

    // Delete any previous OTP for this email+phone+role combo
    await Otp.deleteMany({ email: email.toLowerCase(), phone: cleanPhone, role });

    // Store OTP (expires in 5 minutes)
    await Otp.create({
      email: email.toLowerCase(),
      phone: cleanPhone,
      emailOtp,
      phoneOtp,
      role,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send OTPs
    const emailSent = await sendOtpEmail(email, emailOtp);
    const smsSent = await sendOtpSms(cleanPhone, phoneOtp);

    // For development: include OTPs in response (remove in production!)
    const devInfo = process.env.NODE_ENV !== 'production'
      ? { _dev_emailOtp: emailOtp, _dev_phoneOtp: phoneOtp }
      : {};

    res.json({
      success: true,
      message: 'OTP sent successfully to your email and phone',
      emailSent,
      smsSent,
      ...devInfo,
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
// @desc    Verify email and phone OTPs
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, phone, emailOtp, phoneOtp, role } = req.body;

    if (!email || !phone || !emailOtp || !phoneOtp || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Find OTP record
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      phone: cleanPhone,
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

    // Verify OTPs
    const emailMatch = otpRecord.emailOtp === emailOtp.trim();
    const phoneMatch = otpRecord.phoneOtp === phoneOtp.trim();

    if (!emailMatch || !phoneMatch) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      const remaining = 5 - otpRecord.attempts;
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
        emailVerified: emailMatch,
        phoneVerified: phoneMatch,
      });
    }

    // Both verified — mark the OTP record
    otpRecord.emailVerified = true;
    otpRecord.phoneVerified = true;
    await otpRecord.save();

    res.json({
      success: true,
      message: 'Both email and phone verified successfully!',
      emailVerified: true,
      phoneVerified: true,
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
// @desc    Register a new owner (requires OTP verification)
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

    // Check if owner already exists
    const existingOwner = await Owner.findOne({ $or: [{ email }, { username }] });
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: 'Owner with this email or username already exists',
      });
    }

    // Check OTP verification status (skip if no phone provided — backward compat)
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const otpRecord = await Otp.findOne({
        email: email.toLowerCase(),
        phone: cleanPhone,
        role: 'owner',
        emailVerified: true,
        phoneVerified: true,
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your email and phone before registering',
        });
      }

      // Clean up OTP record
      await otpRecord.deleteOne();
    }

    // Create new owner
    const owner = await Owner.create({
      username,
      email,
      password,
      phone,
      role: 'owner',
      isEmailVerified: !!phone, // verified if OTP flow was used
    });

    // Generate JWT token
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
// @desc    Register a new student (requires OTP verification)
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

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists',
      });
    }

    // Verify OTP completion
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      phone: cleanPhone,
      role: 'student',
      emailVerified: true,
      phoneVerified: true,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email and phone before registering',
      });
    }

    // Clean up OTP record
    await otpRecord.deleteOne();

    // Create new student — already verified!
    const student = await Student.create({
      name,
      email,
      password,
      phone,
      role: 'student',
      isEmailVerified: true,
      isPhoneVerified: true,
    });

    // Generate auth token
    const token = jwt.sign(
      { id: student._id, role: 'student', email: student.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful! Email and phone verified.',
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
// @access  Private (both student and owner)
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
