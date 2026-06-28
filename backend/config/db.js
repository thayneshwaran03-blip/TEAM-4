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
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
