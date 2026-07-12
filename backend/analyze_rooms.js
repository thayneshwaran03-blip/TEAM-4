require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');
const User = require('./models/User');

async function analyze() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Get all rooms sorted by block, floor, roomNumber
        const allRooms = await Room.find({}).sort({ blockName: 1, floorNumber: 1, roomNumber: 1 });

        console.log(`\n=== TOTAL ROOM COUNT: ${allRooms.length} ===\n`);

        // Group by block + floor
        const grouped = {};
        for (const r of allRooms) {
            const key = `${r.blockName}|${r.floorNumber}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        }

        // Print table
        console.log('Block       | Floor | Room Numbers Present                          | Count | Expected');
        console.log('------------|-------|-----------------------------------------------|-------|---------');
        const blocks = ['Block A', 'Block B', 'Block C', 'Block D'];
        const floors = ['1', '2'];
        for (const block of blocks) {
            for (const floor of floors) {
                const key = `${block}|${floor}`;
                const rooms = grouped[key] || [];
                const roomNums = rooms.map(r => r.roomNumber).join(', ');
                const count = rooms.length;
                const flag = count !== 4 ? ' *** MISMATCH ***' : '';
                console.log(`${block.padEnd(12)}| ${floor.padEnd(6)}| ${roomNums.padEnd(46)}| ${String(count).padEnd(6)}| 4${flag}`);
            }
        }

        // Check for rooms outside the 4 expected blocks
        const otherRooms = allRooms.filter(r => !blocks.includes(r.blockName));
        if (otherRooms.length > 0) {
            console.log(`\n=== ROOMS OUTSIDE EXPECTED BLOCKS ===`);
            otherRooms.forEach(r => console.log(`  ${r.roomNumber} (block: "${r.blockName}", floor: ${r.floorNumber}, hostel: ${r.hostelName})`));
        }

        // Identify extra/unexpected rooms
        const expectedPattern = {};
        const blockLetters = { 'Block A': 'A', 'Block B': 'B', 'Block C': 'C', 'Block D': 'D' };
        for (const block of blocks) {
            const letter = blockLetters[block];
            expectedPattern[`${block}|1`] = [`${letter}101`, `${letter}102`, `${letter}103`, `${letter}104`];
            expectedPattern[`${block}|2`] = [`${letter}201`, `${letter}202`, `${letter}203`, `${letter}204`];
        }

        console.log(`\n=== ROOM NUMBER PATTERN CHECK ===\n`);
        const extraRoomIds = [];
        for (const block of blocks) {
            for (const floor of floors) {
                const key = `${block}|${floor}`;
                const actual = (grouped[key] || []).map(r => r.roomNumber);
                const expected = expectedPattern[key];
                const extra = actual.filter(rn => !expected.includes(rn));
                const missing = expected.filter(rn => !actual.includes(rn));
                if (extra.length > 0 || missing.length > 0) {
                    console.log(`${block} Floor ${floor}:`);
                    if (extra.length > 0) {
                        console.log(`  EXTRA (unexpected): ${extra.join(', ')}`);
                        // Track these for occupancy check
                        const extraDocs = (grouped[key] || []).filter(r => extra.includes(r.roomNumber));
                        extraDocs.forEach(r => extraRoomIds.push(r));
                    }
                    if (missing.length > 0) console.log(`  MISSING: ${missing.join(', ')}`);
                }
            }
        }

        // Check occupancy of extra rooms
        if (extraRoomIds.length > 0) {
            console.log(`\n=== EXTRA ROOM OCCUPANCY CHECK ===\n`);
            for (const r of extraRoomIds) {
                const studentsInRoom = await User.find({ room: r._id }).select('fullName registerNumber');
                console.log(`Room ${r.roomNumber} (${r.blockName}, Floor ${r.floorNumber}, ${r.hostelName || 'N/A'}):`);
                console.log(`  _id: ${r._id}`);
                console.log(`  occupiedBeds: ${r.occupiedBeds}, capacity: ${r.capacity}, status: ${r.status}`);
                console.log(`  assignedStudents array: [${r.assignedStudents.join(', ')}]`);
                if (studentsInRoom.length > 0) {
                    studentsInRoom.forEach(s => console.log(`  ** STUDENT FOUND: ${s.fullName} (${s.registerNumber})`));
                } else {
                    console.log(`  No students assigned (EMPTY)`);
                }
                console.log('');
            }
        }

        // Hostel assignment check
        console.log(`\n=== HOSTEL ASSIGNMENT PER BLOCK ===\n`);
        for (const block of blocks) {
            const blockRooms = allRooms.filter(r => r.blockName === block);
            const hostels = [...new Set(blockRooms.map(r => r.hostelName).filter(Boolean))];
            console.log(`${block}: ${hostels.join(', ') || 'NO HOSTEL SET'}`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}
analyze();
