const Room = require('../models/Room');
const User = require('../models/User');

const syncRoomStats = async (roomId) => {
  if (!roomId) return;
  try {
    const room = await Room.findById(roomId);
    if (!room) return;

    // Find all active students assigned to this room
    const students = await User.find({ room: roomId, role: 'student' });
    const studentIds = students.map(s => s._id);

    room.assignedStudents = studentIds;
    room.occupiedBeds = studentIds.length;

    // Room status logic:
    // - If Occupied Beds >= capacity (4), mark room as FULL.
    // - If Occupied Beds = 0, mark room as VACANT.
    // - Otherwise mark room as PARTIALLY OCCUPIED.
    if (room.occupiedBeds >= room.capacity) {
      room.status = 'FULL';
    } else if (room.occupiedBeds === 0) {
      room.status = 'VACANT';
    } else {
      room.status = 'PARTIALLY OCCUPIED';
    }

    await room.save();
    console.log(`[Room Helper] Synced Room ${room.roomNumber}: Beds occupied = ${room.occupiedBeds}, Status = ${room.status}`);
  } catch (error) {
    console.error(`[Room Helper] Error syncing room stats for room ID ${roomId}:`, error);
  }
};

module.exports = { syncRoomStats };
