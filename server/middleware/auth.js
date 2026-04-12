import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';
import Student from '../models/Student.js';

// Generic authentication - verifies token and attaches user
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Determine user type from token role
    const role = decoded.role;

    if (!role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

    let user;
    if (role === 'owner') {
      user = await Owner.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Owner not found'
        });
      }
    } else if (role === 'student') {
      user = await Student.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Student not found'
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid role'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      role: role,
      email: user.email
    };

    next();
  } catch (error) {
    // Handle known JWT errors silently (stale tokens from browser)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.',
        tokenInvalid: true,
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        tokenExpired: true,
      });
    }
    // Only log truly unexpected errors
    console.error('Authentication error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Owner-specific authentication
const authenticateOwner = async (req, res, next) => {
  try {
    // First run generic authentication
    await authenticate(req, res, () => {
      // Check if user is an owner
      if (req.user.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Owner access required'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Owner authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Student-specific authentication
const authenticateStudent = async (req, res, next) => {
  try {
    // First run generic authentication
    await authenticate(req, res, () => {
      // Check if user is a student
      if (req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: 'Student access required'
        });
      }
      next();
    });
  } catch (error) {
    console.error('Student authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export { authenticate, authenticateOwner, authenticateStudent };
