const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const VisitorRequest = require('../models/VisitorRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Room = require('../models/Room');
const { syncRoomStats } = require('../utils/roomHelper');


const updateNotification = async (recipient, type, title, message, relatedTo, metadata = {}) => {
  return Notification.create({ recipient, type, title, message, relatedTo, metadata });
};

const normalizeAssignedBlocks = (user) => {
  const rawBlocks = user?.assignedBlocks || [];
  if (!Array.isArray(rawBlocks)) return [];

  const normalizedBlocks = new Set();
  rawBlocks.forEach((block) => {
    if (!block) return;

    const value = String(block).trim();
    if (!value) return;

    normalizedBlocks.add(value);
    if (value.startsWith('Block ')) {
      normalizedBlocks.add(value.replace('Block ', '').trim());
    } else {
      normalizedBlocks.add(`Block ${value}`);
    }
  });

  return Array.from(normalizedBlocks);
};

const getWardenScopeQuery = async (user) => {
  const orConditions = [{ warden: user._id }];
  
  const studentQuery = { role: 'student' };
  if (user.assignedHostel) {
    studentQuery.hostelName = user.assignedHostel;
  }
  const assignedBlocks = normalizeAssignedBlocks(user);
  if (assignedBlocks.length > 0) {
    studentQuery.block = { $in: assignedBlocks };
  }
  
  const students = await User.find(studentQuery).select('_id');
  const studentIds = students.map(s => s._id);
  if (studentIds.length > 0) {
    orConditions.push({ student: { $in: studentIds } });
  }
  
  return { $or: orConditions };
};

const getWardenDashboard = async (req, res) => {
  try {
    const scopeQuery = await getWardenScopeQuery(req.user);
    const pendingLeaveRequestsCount = await LeaveRequest.countDocuments({ ...scopeQuery, status: 'Pending' });
    const pendingComplaintsCount = await Complaint.countDocuments({ ...scopeQuery, status: 'Pending' });
    const pendingVisitorRequestsCount = await VisitorRequest.countDocuments({ ...scopeQuery, status: 'Pending' });

    return res.status(200).json({
      success: true,
      overview: {
        pendingLeaveRequestsCount,
        pendingComplaintsCount,
        pendingVisitorRequestsCount,
      },
    });
  } catch (error) {
    console.error('Get Warden Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch warden dashboard', error: error.message });
  }
};

const listLeaveRequests = async (req, res) => {
  try {
    const scopeQuery = await getWardenScopeQuery(req.user);
    const leaveRequests = await LeaveRequest.find(scopeQuery)
      .populate({
        path: 'student',
        select: 'fullName email phoneNumber room roomNumber block hostelName',
        populate: { path: 'room', select: 'roomNumber blockName' }
      })
      .populate({ path: 'room', select: 'roomNumber blockName' })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, leaveRequests });
  } catch (error) {
    console.error('List Leave Requests Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve leave requests', error: error.message });
  }
};

const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const scopeQuery = await getWardenScopeQuery(req.user);
    const leaveRequest = await LeaveRequest.findOne({ _id: id, $or: scopeQuery.$or }).populate('student', 'fullName');
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending leave requests can be reviewed' });
    }

    if (action === 'approve') {
      leaveRequest.status = 'Approved';
      leaveRequest.approvedBy = req.user._id;
      leaveRequest.rejectedBy = null;
      leaveRequest.history.push({ status: 'Approved', changedBy: req.user._id, comment: comment || 'Leave approved by warden' });
      await updateNotification(
        leaveRequest.student._id,
        'Leave',
        'Leave Request Approved',
        `Your leave request has been approved by ${req.user.fullName}.`,
        leaveRequest._id,
        { status: 'Approved' }
      );
    } else {
      leaveRequest.status = 'Rejected';
      leaveRequest.rejectedBy = req.user._id;
      leaveRequest.approvedBy = null;
      leaveRequest.history.push({ status: 'Rejected', changedBy: req.user._id, comment: comment || 'Leave rejected by warden' });
      await updateNotification(
        leaveRequest.student._id,
        'Leave',
        'Leave Request Rejected',
        `Your leave request has been rejected by ${req.user.fullName}.`,
        leaveRequest._id,
        { status: 'Rejected' }
      );
    }

    await leaveRequest.save();
    return res.status(200).json({ success: true, message: `Leave request ${action}d successfully`, leaveRequest });
  } catch (error) {
    console.error('Review Leave Request Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to review leave request', error: error.message });
  }
};

const listComplaints = async (req, res) => {
  try {
    const scopeQuery = await getWardenScopeQuery(req.user);
    const complaints = await Complaint.find(scopeQuery)
      .populate({
        path: 'student',
        select: 'fullName email room roomNumber',
        populate: { path: 'room', select: 'roomNumber blockName' }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error('List Complaints Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve complaints', error: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, assignedTeam, comment } = req.body;

    const statusMap = {
      accept: 'In Progress',
      assign: 'In Progress',
      in_progress: 'In Progress',
      resolve: 'Resolved',
      reject: 'Rejected',
    };

    if (!statusMap[action]) {
      return res.status(400).json({ success: false, message: 'Invalid complaint action' });
    }

    const scopeQuery = await getWardenScopeQuery(req.user);
    const complaint = await Complaint.findOne({ _id: id, $or: scopeQuery.$or }).populate('student', 'fullName');
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (complaint.status === 'Resolved' || complaint.status === 'Rejected') {
      return res.status(400).json({ success: false, message: 'Cannot modify a closed complaint' });
    }

    complaint.status = statusMap[action];
    if (assignedTeam) {
      complaint.assignedTeam = assignedTeam;
    }
    complaint.history.push({ status: complaint.status, changedBy: req.user._id, comment: comment || `Complaint ${action} by warden` });
    await complaint.save();

    const messageMap = {
      accept: 'Your complaint has been accepted and is now in progress.',
      assign: `Your complaint has been assigned to ${assignedTeam}.`,
      in_progress: 'Your complaint is now being worked on.',
      resolve: 'Your complaint has been resolved.',
      reject: 'Your complaint has been rejected by the warden.',
    };

    await updateNotification(
      complaint.student._id,
      'Complaint',
      `Complaint ${complaint.status}`,
      messageMap[action],
      complaint._id,
      { status: complaint.status, assignedTeam }
    );

    return res.status(200).json({ success: true, message: 'Complaint status updated successfully', complaint });
  } catch (error) {
    console.error('Update Complaint Status Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update complaint status', error: error.message });
  }
};

const listVisitorRequests = async (req, res) => {
  try {
    const scopeQuery = await getWardenScopeQuery(req.user);
    const visitorRequests = await VisitorRequest.find(scopeQuery)
      .populate({
        path: 'student',
        select: 'fullName email room roomNumber',
        populate: { path: 'room', select: 'roomNumber blockName' }
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, visitorRequests });
  } catch (error) {
    console.error('List Visitor Requests Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve visitor requests', error: error.message });
  }
};

const reviewVisitorRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    }

    const scopeQuery = await getWardenScopeQuery(req.user);
    const request = await VisitorRequest.findOne({ _id: id, $or: scopeQuery.$or }).populate('student', 'fullName');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Visitor request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending visitor requests can be reviewed' });
    }

    request.status = action === 'approve' ? 'Approved' : 'Rejected';
    request.reviewedBy = req.user._id;
    request.history.push({ status: request.status, changedBy: req.user._id, comment: comment || `Visitor request ${action}d by warden` });
    await request.save();

    await updateNotification(
      request.student._id,
      'Visitor',
      `Visitor Request ${request.status}`,
      `Your visitor request has been ${request.status.toLowerCase()} by ${req.user.fullName}.`,
      request._id,
      { status: request.status }
    );

    return res.status(200).json({ success: true, message: `Visitor request ${request.status.toLowerCase()} successfully`, request });
  } catch (error) {
    console.error('Review Visitor Request Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to review visitor request', error: error.message });
  }
};

// ── Student Management ──────────────────────────────────────────────────────
const listStudents = async (req, res) => {
  try {
    const studentQuery = { role: 'student' };
    if (req.user.assignedHostel) {
      studentQuery.hostelName = req.user.assignedHostel;
    }
    if (req.user.assignedBlocks && req.user.assignedBlocks.length > 0) {
      const blocks = [];
      req.user.assignedBlocks.forEach(b => {
        blocks.push(b);
        if (b.startsWith('Block ')) {
          blocks.push(b.replace('Block ', '').trim());
        } else {
          blocks.push(`Block ${b}`);
        }
      });
      studentQuery.block = { $in: blocks };
    }

    const students = await User.find(studentQuery)
      .populate({ path: 'room', select: 'roomNumber blockName' })
      .select('-password -resetOtp -resetOtpExpiry');
    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('List Students Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve students', error: error.message });
  }
};

// ── Warden Profile & Password ──────────────────────────────────────────────
const getWardenProfile = async (req, res) => {
  try {
    const warden = await User.findById(req.user._id).select('-password');
    if (!warden) {
      return res.status(404).json({ success: false, message: 'Warden profile not found' });
    }
    return res.status(200).json({ success: true, warden });
  } catch (error) {
    console.error('Get Warden Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch warden profile', error: error.message });
  }
};

const updateWardenProfile = async (req, res) => {
  try {
    const allowedFields = ['fullName', 'phoneNumber', 'gender'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No allowed fields provided to update' });
    }

    const updatedWarden = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
      select: '-password',
    });

    if (!updatedWarden) {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully', warden: updatedWarden });
  } catch (error) {
    console.error('Update Warden Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update profile', error: error.message });
  }
};

const changeWardenPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    const warden = await User.findById(req.user._id).select('+password');
    if (!warden) {
      return res.status(404).json({ success: false, message: 'Warden not found' });
    }

    const isMatch = await warden.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    warden.password = newPassword;
    await warden.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Warden Password Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to change password', error: error.message });
  }
};

// ── Notifications ────────────────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch notifications', error: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, recipient: req.user._id });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.status = 'Read';
    await notification.save();

    return res.status(200).json({ success: true, message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update notification', error: error.message });
  }
};

// ── Announcements CRUD ──────────────────────────────────────────────────────
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
      postedByRole: 'warden',
      visibleTo: visibleTo && visibleTo.length > 0 ? visibleTo : ['student', 'warden'],
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

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, visibleTo, pinned } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (priority) announcement.priority = priority;
    if (visibleTo) announcement.visibleTo = visibleTo;
    if (pinned !== undefined) announcement.pinned = pinned;

    await announcement.save();

    return res.status(200).json({ success: true, message: 'Announcement updated successfully', announcement });
  } catch (error) {
    console.error('Update Announcement Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update announcement', error: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    return res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Delete Announcement Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete announcement', error: error.message });
  }
};

const listRooms = async (req, res) => {
  try {
    const roomQuery = {};
    if (req.user.assignedBlocks && req.user.assignedBlocks.length > 0) {
      const blocks = [];
      req.user.assignedBlocks.forEach(b => {
        blocks.push(b);
        if (b.startsWith('Block ')) {
          blocks.push(b.replace('Block ', '').trim());
        } else {
          blocks.push(`Block ${b}`);
        }
      });
      roomQuery.blockName = { $in: blocks };
    }
    const rooms = await Room.find(roomQuery).sort({ blockName: 1, floorNumber: 1, roomNumber: 1 });
    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error('Warden List Rooms Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve rooms', error: error.message });
  }
};

const allocateRoom = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { roomId } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const oldRoomId = student.room;

    if (oldRoomId && oldRoomId.toString() === roomId) {
      return res.status(200).json({ success: true, message: 'Student is already allocated to this room' });
    }

    if (oldRoomId) {
      const oldRoom = await Room.findById(oldRoomId);
      if (oldRoom) {
        oldRoom.assignedStudents = oldRoom.assignedStudents.filter(id => id.toString() !== studentId);
        await oldRoom.save();
      }
    }

    if (roomId) {
      const newRoom = await Room.findById(roomId);
      if (!newRoom) {
        return res.status(404).json({ success: false, message: 'New room not found' });
      }

      if (newRoom.occupiedBeds >= newRoom.capacity && oldRoomId?.toString() !== newRoom._id.toString()) {
        return res.status(400).json({ success: false, message: 'New room is already full' });
      }

      if (!newRoom.assignedStudents.includes(studentId)) {
        newRoom.assignedStudents.push(studentId);
      }
      await newRoom.save();

      student.room = roomId;
    } else {
      student.room = null;
    }

    await student.save();

    if (oldRoomId) {
      await syncRoomStats(oldRoomId);
    }
    if (roomId) {
      await syncRoomStats(roomId);
    }

    await updateNotification(
      studentId,
      'Info',
      'Room Allocation Updated',
      student.room ? 'Your room has been assigned/updated by the warden.' : 'Your room allocation has been released.',
      student.room || null,
      { status: 'Updated' }
    );

    return res.status(200).json({ success: true, message: 'Room allocated successfully', student });
  } catch (error) {
    console.error('Allocate Room Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to allocate room', error: error.message });
  }
};

const getWardenOccupancyDashboard = async (req, res) => {
  try {
    const warden = req.user;
    const assignedBlocks = normalizeAssignedBlocks(warden);
    if (!warden.assignedHostel || assignedBlocks.length === 0) {
      return res.status(200).json({
        success: true,
        stats: { totalCapacity: 0, occupiedBeds: 0, availableBeds: 0, occupancyRate: 0, occupiedRooms: 0, vacantRooms: 0 }
      });
    }

    const rooms = await Room.find({ blockName: { $in: assignedBlocks } }).populate('assignedStudents');

    let totalCapacity = 0;
    let occupiedBeds = 0;
    let occupiedRoomsCount = 0;
    let vacantRoomsCount = 0;

    rooms.forEach(r => {
      totalCapacity += (r.capacity || 4);
      occupiedBeds += (r.occupiedBeds || 0);
      if (r.occupiedBeds > 0) {
        occupiedRoomsCount++;
      } else {
        vacantRoomsCount++;
      }
    });

    const availableBeds = Math.max(0, totalCapacity - occupiedBeds);
    const occupancyRate = totalCapacity > 0 ? ((occupiedBeds / totalCapacity) * 100).toFixed(1) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalCapacity,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        occupiedRooms: occupiedRoomsCount,
        vacantRooms: vacantRoomsCount
      }
    });
  } catch (error) {
    console.error('Warden Occupancy Dashboard Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getWardenOccupancyReport = async (req, res) => {
  try {
    const warden = req.user;
    const assignedBlocks = normalizeAssignedBlocks(warden);
    if (!warden.assignedHostel || assignedBlocks.length === 0) {
      return res.status(200).json({ success: true, rooms: [] });
    }

    const rooms = await Room.find({ blockName: { $in: assignedBlocks } }).populate('assignedStudents').sort({ floorNumber: 1, roomNumber: 1 });

    const formattedRooms = rooms.map(r => ({
      _id: r._id,
      roomNumber: r.roomNumber,
      floorNumber: r.floorNumber,
      capacity: r.capacity || 4,
      occupiedBeds: r.occupiedBeds || 0,
      availableBeds: Math.max(0, (r.capacity || 4) - (r.occupiedBeds || 0)),
      status: r.status || 'VACANT'
    }));

    return res.status(200).json({ success: true, rooms: formattedRooms });
  } catch (error) {
    console.error('Warden Occupancy Report Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getWardenOccupancyExport = async (req, res) => {
  try {
    const warden = req.user;
    const assignedBlocks = normalizeAssignedBlocks(warden);
    const blockName = assignedBlocks.length > 0 ? assignedBlocks[0] : 'N/A';
    const hostelName = warden.assignedHostel || 'N/A';

    const rooms = await Room.find({ blockName: { $in: assignedBlocks.length > 0 ? assignedBlocks : [blockName] } }).populate('assignedStudents').sort({ floorNumber: 1, roomNumber: 1 });

    let totalCapacity = 0;
    let occupiedBeds = 0;
    let occupiedRoomsCount = 0;
    let vacantRoomsCount = 0;

    rooms.forEach(r => {
      totalCapacity += (r.capacity || 4);
      occupiedBeds += (r.occupiedBeds || 0);
      if (r.occupiedBeds > 0) {
        occupiedRoomsCount++;
      } else {
        vacantRoomsCount++;
      }
    });

    const availableBeds = Math.max(0, totalCapacity - occupiedBeds);
    const occupancyRate = totalCapacity > 0 ? ((occupiedBeds / totalCapacity) * 100).toFixed(1) : 0;

    const formattedRooms = rooms.map(r => ({
      _id: r._id,
      roomNumber: r.roomNumber,
      floorNumber: r.floorNumber,
      capacity: r.capacity || 4,
      occupiedBeds: r.occupiedBeds || 0,
      availableBeds: Math.max(0, (r.capacity || 4) - (r.occupiedBeds || 0)),
      status: r.status || 'VACANT'
    }));

    return res.status(200).json({
      success: true,
      metadata: {
        wardenName: warden.fullName,
        hostelName,
        blockName,
        exportDateTime: new Date().toLocaleString()
      },
      stats: {
        totalCapacity,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        occupiedRooms: occupiedRoomsCount,
        vacantRooms: vacantRoomsCount
      },
      rooms: formattedRooms
    });
  } catch (error) {
    console.error('Warden Occupancy Export Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const registerVisitorOnTheSpot = async (req, res) => {
  try {
    const warden = req.user;
    const { studentIdentifier, visitorName, relationship, phoneNumber, visitDate, purpose } = req.body;

    if (!studentIdentifier || !visitorName || !relationship || !phoneNumber || !visitDate) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    const student = await User.findOne({
      role: 'student',
      $or: [
        { studentId: studentIdentifier },
        { registerNumber: studentIdentifier },
        { rollNumber: studentIdentifier },
        { email: studentIdentifier.toLowerCase() }
      ]
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const assignedBlocks = normalizeAssignedBlocks(warden);
    const isAssignedBlock = assignedBlocks.some((block) => {
      const studentBlock = student.block ? String(student.block).trim() : '';
      return studentBlock === block || studentBlock === `Block ${block}` || block === `Block ${studentBlock}`;
    });

    if (student.hostelName !== warden.assignedHostel || !isAssignedBlock) {
      return res.status(400).json({ success: false, message: 'This student is not assigned to your hostel/block.' });
    }

    const visitorRequest = await VisitorRequest.create({
      student: student._id,
      visitorName,
      relationship,
      phoneNumber,
      visitDate,
      expectedArrivalTime: 'Anytime',
      purpose: purpose || 'On-the-spot Visit',
      status: 'Approved'
    });

    return res.status(201).json({ success: true, message: 'Visitor registered successfully on the spot.', visitorRequest });
  } catch (error) {
    console.error('Warden Register Visitor Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getWardenDashboard,
  registerVisitorOnTheSpot,
  listLeaveRequests,
  reviewLeaveRequest,
  listComplaints,
  updateComplaintStatus,
  listVisitorRequests,
  reviewVisitorRequest,
  listStudents,
  getWardenProfile,
  updateWardenProfile,
  changeWardenPassword,
  getNotifications,
  markNotificationRead,
  createAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  listRooms,
  allocateRoom,
  getWardenOccupancyDashboard,
  getWardenOccupancyReport,
  getWardenOccupancyExport,
};
