const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please fill a valid email address',
      ],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'warden', 'admin'],
      default: 'student',
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    parentName: {
      type: String,
      trim: true,
    },
    parentContact: {
      type: String,
      trim: true,
    },
    // New fields for Student
    registerNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    rollNumber: {
      type: String,
      trim: true,
    },
    hostelName: {
      type: String,
      trim: true,
    },
    block: {
      type: String,
      trim: true,
    },
    floor: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    bedNumber: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      type: String,
      trim: true,
    },
    // New fields for Warden
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    assignedHostel: {
      type: String,
      trim: true,
    },
    assignedBlocks: {
      type: [String],
      default: [],
    },
    // Status and Setup fields
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    isFirstLogin: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    // OTP fields for password reset
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt before saving user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
