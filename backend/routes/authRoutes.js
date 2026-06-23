const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require('../controllers/authController');

// ── Auth Routes ──────────────────────────────────────────────────────────────

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

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

module.exports = router;
