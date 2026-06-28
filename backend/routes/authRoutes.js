const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  firstLoginChangePassword,
} = require('../controllers/authController');

// ── Auth Routes ──────────────────────────────────────────────────────────────

// @route   POST /api/auth/login
// @desc    Login user & return JWT token
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/forgot-password
// @desc    Send OTP to registered email (Step 1)
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP entered by user (Step 2)
// @access  Public
router.post('/verify-otp', verifyOtp);

// @route   POST /api/auth/reset-password
// @desc    Reset password after OTP verification (Step 3)
// @access  Public
router.post('/reset-password', resetPassword);

// @route   PUT /api/auth/first-login-change-password
// @desc    Change password on first login
// @access  Private
router.put('/first-login-change-password', protect, firstLoginChangePassword);

module.exports = router;
