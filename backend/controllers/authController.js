const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      department,
      year,
      gender,
      role,
      parentName,
      parentContact,
      password,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !phoneNumber ||
      !department ||
      !year ||
      !gender ||
      !password
    ) {
      return res.status(400).json({
        message: 'Please provide all required fields: fullName, email, phoneNumber, department, year, gender, and password.',
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        message: 'A user with this email already exists.',
      });
    }

    // Create new user (password hashing is handled in schema pre-save hook)
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      department,
      year,
      gender,
      role: role || 'student', // defaults to 'student' if not specified
      parentName,
      parentContact,
      password,
    });

    if (user) {
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      return res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      message: 'Server error during registration.',
      error: error.message,
    });
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide both email and password.',
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token and return success with user data
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
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
