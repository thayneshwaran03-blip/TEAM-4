const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log('Registered Users in DB:');
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Name: ${u.fullName}, Email: ${u.email}, Role: ${u.role}, PasswordHash: ${u.password.substring(0, 15)}...`);
    });
  } catch (err) {
    console.error('Database query failed:', err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
