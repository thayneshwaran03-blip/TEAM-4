require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function runCheck() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({
            $or: [
                { bedNumber: { $exists: true, $ne: null, $ne: "" } },
                { bed: { $exists: true, $ne: null, $ne: "" } }
            ]
        }).select('fullName registerNumber bedNumber bed');
        
        console.log(`Found ${users.length} users with a bed field:`);
        users.forEach(u => {
            console.log(`- ${u.fullName} (${u.registerNumber}): bedNumber="${u.bedNumber}", bed="${u.bed}"`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}
runCheck();
