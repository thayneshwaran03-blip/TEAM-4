require('dotenv').config();
const mongoose=require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Room=require('./models/Room');
    const r = await Room.find({ roomNumber: { $in: ['101', '102', '105'] } });
    console.log(r);
    mongoose.disconnect();
});
