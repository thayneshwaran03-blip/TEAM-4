require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');

const roomsToDelete = [
    { _id: '6a4767307dd4b1d390355046', label: 'A105 (Block A, Floor 1)' },
    { _id: '6a3e178ba3baa7d00c05c5db', label: 'A106 (Block A, Floor 1)' },
    { _id: '6a3e178ba3baa7d00c05c5dc', label: 'A107 (Block A, Floor 1)' },
    { _id: '6a411666166730d6efb3d8f5', label: 'C105 (Block C, Floor 1)' },
];

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.\n");

        // --- BEFORE STATE ---
        console.log("====== BEFORE STATE ======\n");
        for (const entry of roomsToDelete) {
            const room = await Room.findById(entry._id);
            if (!room) {
                console.log(`${entry.label}: NOT FOUND (already deleted?)\n`);
                continue;
            }
            console.log(`${entry.label}:`);
            console.log(`  roomNumber: ${room.roomNumber}, blockName: ${room.blockName}, floorNumber: ${room.floorNumber}`);
            console.log(`  hostelName: ${room.hostelName || '(missing)'}`);
            console.log(`  occupiedBeds: ${room.occupiedBeds}, capacity: ${room.capacity}, status: ${room.status}`);
            console.log(`  assignedStudents: [${room.assignedStudents.join(', ')}]\n`);
        }

        // --- SAFE DELETION ---
        console.log("====== DELETION PROCESS ======\n");
        let deletedCount = 0;
        for (const entry of roomsToDelete) {
            const room = await Room.findById(entry._id);
            if (!room) {
                console.log(`SKIP: ${entry.label} - document not found.\n`);
                continue;
            }

            // Safety check
            if (room.occupiedBeds !== 0 || room.assignedStudents.length !== 0) {
                console.log(`*** ABORT: ${entry.label} is NOT empty! occupiedBeds=${room.occupiedBeds}, assignedStudents=[${room.assignedStudents}]`);
                console.log(`*** Stopping all further deletions for safety.\n`);
                return;
            }

            await Room.deleteOne({ _id: entry._id });
            console.log(`DELETED: ${entry.label} - confirmed empty before deletion.`);
            deletedCount++;
        }
        console.log(`\nTotal deleted: ${deletedCount}\n`);

        // --- FINAL VERIFICATION ---
        console.log("====== FINAL VERIFICATION ======\n");
        const allRooms = await Room.find({}).sort({ blockName: 1, floorNumber: 1, roomNumber: 1 });
        console.log(`Total room count: ${allRooms.length}\n`);

        const blocks = ['Block A', 'Block B', 'Block C', 'Block D'];
        const floors = ['1', '2'];

        console.log('Block       | Floor | Room Numbers Present              | Count | Status');
        console.log('------------|-------|-----------------------------------|-------|-------');
        for (const block of blocks) {
            for (const floor of floors) {
                const matched = allRooms.filter(r => r.blockName === block && r.floorNumber === floor);
                const roomNums = matched.map(r => r.roomNumber).join(', ');
                const count = matched.length;
                const status = count === 4 ? 'OK' : '*** MISMATCH ***';
                console.log(`${block.padEnd(12)}| ${floor.padEnd(6)}| ${roomNums.padEnd(34)}| ${String(count).padEnd(6)}| ${status}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB.");
    }
}
run();
