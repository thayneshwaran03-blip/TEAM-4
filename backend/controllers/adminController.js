const Announcement = require('../models/Announcement');
const Room = require('../models/Room');

const createAnnouncement = async (req, res) => {
  try {
    const { title, description, priority, visibleTo, pinned } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const announcement = await Announcement.create({
      title,
      description,
      priority: priority || 'Medium',
      postedBy: req.user._id,
      postedByRole: req.user.role,
      visibleTo: visibleTo && visibleTo.length > 0 ? visibleTo : ['student', 'warden', 'admin'],
      pinned: pinned || false,
    });

    return res.status(201).json({ success: true, message: 'Announcement published successfully', announcement });
  } catch (error) {
    console.error('Create Announcement Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to publish announcement', error: error.message });
  }
};

const listAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isPublished: true })
      .populate({ path: 'postedBy', select: 'fullName email role' })
      .sort({ pinned: -1, createdAt: -1 });

    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error('List Announcements Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve announcements', error: error.message });
  }
};

const createRoom = async (req, res) => {
  try {
    const { roomNumber, blockName, floorNumber, capacity, status } = req.body;

    if (!roomNumber || !blockName || !floorNumber || !capacity) {
      return res.status(400).json({ success: false, message: 'Room number, block, floor, and capacity are required' });
    }

    const existingRoom = await Room.findOne({ roomNumber });
    if (existingRoom) {
      return res.status(400).json({ success: false, message: 'Room with that number already exists' });
    }

    const room = await Room.create({
      roomNumber,
      blockName,
      floorNumber,
      capacity,
      status: status || 'Open',
      occupiedBeds: 0,
    });

    return res.status(201).json({ success: true, message: 'Room created successfully', room });
  } catch (error) {
    console.error('Create Room Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create room', error: error.message });
  }
};

const listRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ blockName: 1, floorNumber: 1, roomNumber: 1 });
    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error('List Rooms Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve rooms', error: error.message });
  }
};

module.exports = {
  createAnnouncement,
  listAnnouncements,
  createRoom,
  listRooms,
};
