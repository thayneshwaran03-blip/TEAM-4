require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function runCleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        console.log("--- BEFORE STATE ---");
        const beforeCheck = await User.findOne({ registerNumber: '73152413701' }).select('fullName bedNumber bed');
        console.log(beforeCheck);

        const result = await User.updateOne(
            { registerNumber: '73152413701' },
            { $unset: { bedNumber: "", bed: "" } }
        );
        console.log(`\nMatched ${result.matchedCount} document(s) and modified ${result.modifiedCount} document(s).`);
        
        console.log("\n--- AFTER STATE ---");
        const afterCheck = await User.findOne({ registerNumber: '73152413701' }).select('fullName bedNumber bed');
        console.log(afterCheck);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}
runCleanup();
