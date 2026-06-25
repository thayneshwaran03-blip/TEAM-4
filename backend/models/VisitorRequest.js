const mongoose = require('mongoose');

const visitorRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    warden: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
      maxlength: [120, 'Visitor name cannot exceed 120 characters'],
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    visitDate: {
      type: Date,
      required: [true, 'Visit date is required'],
    },
    expectedArrivalTime: {
      type: String,
      required: [true, 'Expected arrival time is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    history: [
      {
        status: {
          type: String,
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        comment: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const VisitorRequest = mongoose.model('VisitorRequest', visitorRequestSchema);

module.exports = VisitorRequest;
