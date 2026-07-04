const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database (excluding password) and attach to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('Authentication Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const forcePasswordChange = (req, res, next) => {
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({
      success: false,
      code: 'PASSWORD_CHANGE_REQUIRED',
      message: 'You must change your password on first login before accessing this page.'
    });
  }
  next();
};

const forceProfileCompletion = (req, res, next) => {
  if (req.user && req.user.role === 'student' && !req.user.profileCompleted) {
    return res.status(403).json({
      success: false,
      code: 'PROFILE_COMPLETION_REQUIRED',
      message: 'You must complete your profile details before accessing this page.'
    });
  }
  next();
};

module.exports = { protect, forcePasswordChange, forceProfileCompletion };
