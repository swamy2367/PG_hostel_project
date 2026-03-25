import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Room from '../models/Room.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new admin
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, hostelName, hostelLogo, roomConfig } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Admin with this email or username already exists' 
      });
    }

    // Create new admin
    const admin = await Admin.create({
      username,
      email,
      password,
      hostelName,
      hostelLogo,
      roomConfig
    });

    // Initialize rooms based on configuration
    const rooms = [];
    
    // Double sharing rooms
    for (let i = 0; i < roomConfig.double.count; i++) {
      rooms.push({
        number: roomConfig.double.startRoom + i,
        type: 'double',
        capacity: 2,
        status: 'available',
        occupants: [],
        adminId: admin._id
      });
    }
    
    // Triple sharing rooms
    for (let i = 0; i < roomConfig.triple.count; i++) {
      rooms.push({
        number: roomConfig.triple.startRoom + i,
        type: 'triple',
        capacity: 3,
        status: 'available',
        occupants: [],
        adminId: admin._id
      });
    }
    
    // Four sharing rooms
    for (let i = 0; i < roomConfig.four.count; i++) {
      rooms.push({
        number: roomConfig.four.startRoom + i,
        type: 'four',
        capacity: 4,
        status: 'available',
        occupants: [],
        adminId: admin._id
      });
    }

    await Room.insertMany(rooms);

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        hostelName: admin.hostelName,
        hostelLogo: admin.hostelLogo,
        roomConfig: admin.roomConfig
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide username and password' 
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        hostelName: admin.hostelName,
        hostelLogo: admin.hostelLogo,
        roomConfig: admin.roomConfig
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in admin
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    res.json({
      success: true,
      admin
    });

  } catch (error) {
    console.error('Get admin error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

export default router;
