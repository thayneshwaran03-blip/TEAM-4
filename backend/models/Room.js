const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },
    blockName: {
      type: String,
      required: [true, 'Block name is required'],
      trim: true,
    },
    floorNumber: {
      type: String,
      required: [true, 'Floor number is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    occupiedBeds: {
      type: Number,
      default: 0,
      min: [0, 'Occupied beds cannot be negative'],
    },
    hostelName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      default: 'VACANT',
    },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

roomSchema.virtual('availableBeds').get(function () {
  return Math.max(0, this.capacity - this.occupiedBeds);
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
