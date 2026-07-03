const mongoose = require('mongoose');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed default admin
    const adminExists = await User.findOne({ email: 'admin@hostelhub.com' });
    if (!adminExists) {
      await User.create({
        fullName: 'System Admin',
        email: 'admin@hostelhub.com',
        phoneNumber: '0000000000',
        gender: 'Male',
        role: 'admin',
        isActive: true,
        mustChangePassword: false,
        password: 'Admin@123',
      });
      console.log('Default Admin Account seeded: admin@hostelhub.com / Admin@123');
    }

    // Seed fixed rooms structure (32 rooms: 4 blocks * 2 floors * 4 rooms)
    const Room = require('../models/Room');
    const blocks = ['Block A', 'Block B', 'Block C', 'Block D'];
    const floors = ['1', '2'];
    const roomsPerFloor = ['01', '02', '03', '04'];
    const capacity = 4;

    for (const block of blocks) {
      const hostelName = (block === 'Block A' || block === 'Block B') ? 'Boys Hostel' : 'Girls Hostel';
      const blockLetter = block.replace('Block ', '').trim();
      for (const floor of floors) {
        for (const roomSuffix of roomsPerFloor) {
          const roomNumber = `${blockLetter}${floor}${roomSuffix}`;
          let room = await Room.findOne({ roomNumber });
          if (room) {
            room.hostelName = hostelName;
            room.blockName = block;
            room.floorNumber = floor;
            room.capacity = capacity;
            room.occupiedBeds = room.assignedStudents ? room.assignedStudents.length : 0;
            if (room.occupiedBeds >= capacity) {
              room.status = 'FULL';
            } else if (room.occupiedBeds === 0) {
              room.status = 'VACANT';
            } else {
              room.status = 'PARTIALLY OCCUPIED';
            }
            await room.save();
          } else {
            await Room.create({
              roomNumber,
              blockName: block,
              floorNumber: floor,
              capacity,
              occupiedBeds: 0,
              hostelName,
              status: 'VACANT',
              assignedStudents: []
            });
          }
        }
      }
    }
    console.log('Fixed hostel structure rooms checked/seeded successfully.');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
