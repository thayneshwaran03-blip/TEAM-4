const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const VisitorRequest = require('../models/VisitorRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Announcement = require('../models/Announcement');
const Room = require('../models/Room');


const updateNotification = async (recipient, type, title, message, relatedTo, metadata = {}) => {
  return Notification.create({ recipient, type, title, message, relatedTo, metadata });
};

const getWardenDashboard = async (req, res) => {
  try {
    const pendingLeaveRequestsCount = await LeaveRequest.countDocuments({ status: 'Pending', warden: req.user._id });
    const pendingComplaintsCount = await Complaint.countDocuments({ status: 'Pending', warden: req.user._id });
    const pendingVisitorRequestsCount = await VisitorRequest.countDocuments({ status: 'Pending', warden: req.user._id });

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
    const leaveRequests = await LeaveRequest.find({ warden: req.user._id })
      .populate({ path: 'student', select: 'fullName email phoneNumber' })
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

    const leaveRequest = await LeaveRequest.findOne({ _id: id, warden: req.user._id }).populate('student', 'fullName');
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
    const complaints = await Complaint.find({ warden: req.user._id })
      .populate({ path: 'student', select: 'fullName email room' })
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

    const complaint = await Complaint.findOne({ _id: id, warden: req.user._id }).populate('student', 'fullName');
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
    const visitorRequests = await VisitorRequest.find({ warden: req.user._id })
      .populate({ path: 'student', select: 'fullName email room' })
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

    const request = await VisitorRequest.findOne({ _id: id, warden: req.user._id }).populate('student', 'fullName');
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
    const students = await User.find({ role: 'student' })
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
    const rooms = await Room.find().sort({ blockName: 1, floorNumber: 1, roomNumber: 1 });
    return res.status(200).json({ success: true, rooms });
  } catch (error) {
    console.error('Warden List Rooms Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve rooms', error: error.message });
  }
};

const allocateRoom = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { roomId } = req.body; // can be null to deallocate

    // Find student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const oldRoomId = student.room;

    if (oldRoomId && oldRoomId.toString() === roomId) {
      return res.status(200).json({ success: true, message: 'Student is already allocated to this room' });
    }

    // If student has an old room, remove student from old room
    if (oldRoomId) {
      const oldRoom = await Room.findById(oldRoomId);
      if (oldRoom) {
        oldRoom.assignedStudents = oldRoom.assignedStudents.filter(id => id.toString() !== studentId);
        oldRoom.occupiedBeds = Math.max(0, oldRoom.assignedStudents.length);
        if (oldRoom.occupiedBeds < oldRoom.capacity && oldRoom.status === 'Full') {
          oldRoom.status = 'Open';
        }
        await oldRoom.save();
      }
    }

    // Allocate new room
    if (roomId) {
      const newRoom = await Room.findById(roomId);
      if (!newRoom) {
        return res.status(404).json({ success: false, message: 'New room not found' });
      }

      if (newRoom.occupiedBeds >= newRoom.capacity) {
        return res.status(400).json({ success: false, message: 'New room is already full' });
      }

      if (!newRoom.assignedStudents.includes(studentId)) {
        newRoom.assignedStudents.push(studentId);
      }
      newRoom.occupiedBeds = newRoom.assignedStudents.length;
      if (newRoom.occupiedBeds >= newRoom.capacity) {
        newRoom.status = 'Full';
      }
      await newRoom.save();

      student.room = roomId;
    } else {
      // Deallocate
      student.room = null;
    }

    await student.save();

    return res.status(200).json({ success: true, message: 'Room allocated successfully', student });
  } catch (error) {
    console.error('Allocate Room Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to allocate room', error: error.message });
  }
};

module.exports = {
  getWardenDashboard,
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
};
