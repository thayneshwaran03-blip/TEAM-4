const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// ── Helper: Generate JWT ─────────────────────────────────────────────────────
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ── Helper: Generate 6-digit OTP ─────────────────────────────────────────────
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ── Helper: Send OTP email via nodemailer ─────────────────────────────────────
const sendOtpEmail = async (toEmail, otp, userName) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"HostelHub Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'HostelHub – Your Password Reset OTP',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8f9fa; padding: 32px; border-radius: 16px;">
        <div style="background: linear-gradient(135deg, #1a237e, #3949ab); padding: 28px; border-radius: 12px; text-align: center; margin-bottom: 28px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
            Hostel<span style="color: #ffa726;">Hub</span>
          </h1>
          <p style="color: rgba(255,255,255,0.75); margin: 8px 0 0; font-size: 14px;">Centralized Hostel Management System</p>
        </div>

        <div style="background: white; padding: 28px; border-radius: 12px; border: 1px solid #e8ecf0;">
          <h2 style="color: #1a237e; margin: 0 0 12px; font-size: 20px; font-weight: 700;">
            Password Reset Request
          </h2>
          <p style="color: #555; line-height: 1.6; margin: 0 0 24px; font-size: 15px;">
            Hello <strong>${userName}</strong>,<br/>
            We received a request to reset your HostelHub account password. Use the OTP below to proceed:
          </p>

          <div style="background: #f0f4ff; border: 2px dashed #3949ab; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 6px; color: #666; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
              Your One-Time Password
            </p>
            <h1 style="margin: 0; color: #1a237e; font-size: 48px; font-weight: 900; letter-spacing: 12px; font-family: monospace;">
              ${otp}
            </h1>
          </div>

          <div style="background: #fff8e1; border-left: 4px solid #ffa726; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 0; color: #7d5f00; font-size: 13px; font-weight: 600;">
              ⚠️ This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.
            </p>
          </div>

          <p style="color: #888; font-size: 13px; margin: 0; line-height: 1.6;">
            If you did not request a password reset, please ignore this email. Your account remains secure.
          </p>
        </div>

        <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 20px;">
          © 2026 HostelHub System · Centralized College Hostel Management
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ════════════════════════════════════════════════════════════════════════════
// REGISTER
// ════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact the Hostel Administration.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        department: user.department,
        year: user.year,
        gender: user.gender,
        role: user.role,
        parentName: user.parentName,
        parentContact: user.parentContact,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD – STEP 1: Send OTP
// ════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Send OTP to registered email for password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return generic message to avoid user enumeration
      return res.status(404).json({
        message: 'No account found with this email address.',
      });
    }

    // Generate a 6-digit OTP valid for 10 minutes
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP + expiry to user document
    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    await sendOtpEmail(user.email, otp, user.fullName);

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${user.email}. Valid for 10 minutes.`,
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({
      message: 'Failed to send OTP. Please check server email configuration.',
      error: error.message,
    });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// VERIFY OTP – STEP 2: Validate the OTP
// ════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Verify the OTP entered by user
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Check if OTP exists
    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({
        message: 'No OTP was requested for this account. Please click "Forgot Password" again.',
      });
    }

    // Check if OTP has expired
    if (new Date() > user.resetOtpExpiry) {
      // Clear expired OTP
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Check if OTP matches
    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You may now reset your password.',
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ message: 'Server error during OTP verification.', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD – STEP 3: Set new password
// ════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Reset user password after OTP verification
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // Re-verify OTP for security (prevents skipping step 2)
    if (!user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ message: 'Session expired. Please restart the forgot password process.' });
    }

    if (new Date() > user.resetOtpExpiry) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: 'OTP has expired. Please restart the process.' });
    }

    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Cannot reset password.' });
    }

    // Hash new password and save (the pre-save hook will hash it)
    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ message: 'Server error during password reset.', error: error.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// FIRST LOGIN CHANGE PASSWORD
// ════════════════════════════════════════════════════════════════════════════
/**
 * @desc    Change password on first login
 * @route   PUT /api/auth/first-login-change-password
 * @access  Private
 */
const firstLoginChangePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Redirecting to dashboard...',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        department: user.department,
        year: user.year,
        gender: user.gender,
        role: user.role,
        parentName: user.parentName,
        parentContact: user.parentContact,
        mustChangePassword: false,
      }
    });
  } catch (error) {
    console.error('First Login Password Change Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to change password', error: error.message });
  }
};

module.exports = {
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  firstLoginChangePassword,
};
