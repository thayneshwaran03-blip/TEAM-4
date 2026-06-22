const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// @route   GET /api/student/dashboard
// @desc    Access Student dashboard
// @access  Protected (Student only)
router.get(
  '/student/dashboard',
  protect,
  authorizeRoles('student'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Student Dashboard!',
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

// @route   GET /api/warden/dashboard
// @desc    Access Warden dashboard
// @access  Protected (Warden only)
router.get(
  '/warden/dashboard',
  protect,
  authorizeRoles('warden'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Warden Dashboard!',
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

// @route   GET /api/admin/dashboard
// @desc    Access Admin dashboard
// @access  Protected (Admin only)
router.get(
  '/admin/dashboard',
  protect,
  authorizeRoles('admin'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Welcome to the Admin Dashboard!',
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
      },
    });
  }
);

module.exports = router;
