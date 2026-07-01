const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Room = require('../models/Room');
const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const VisitorRequest = require('../models/VisitorRequest');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

const updateNotification = async (recipient, type, title, message, relatedTo, metadata = {}) => {
  return Notification.create({
    recipient,
    type,
    title,
    message,
    relatedTo,
    metadata,
  });
};

const getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select('-password -resetOtp -resetOtpExpiry')
      .populate({
        path: 'room',
        select: 'roomNumber blockName floorNumber capacity occupiedBeds status',
      });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    return res.status(200).json({ success: true, student });
  } catch (error) {
    console.error('Get Student Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch student profile', error: error.message });
  }
};

const updateStudentProfile = async (req, res) => {
  try {
    const allowedFields = ['fullName', 'phoneNumber', 'department', 'year', 'gender', 'parentName', 'parentContact'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No allowed fields provided to update' });
    }

    const updatedStudent = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
      context: 'query',
      select: '-password -resetOtp -resetOtpExpiry',
    }).populate({
      path: 'room',
      select: 'roomNumber blockName floorNumber capacity occupiedBeds status',
    });

    if (!updatedStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('Update Student Profile Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update profile', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    const student = await User.findById(req.user._id).select('+password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const isMatch = await student.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    student.password = newPassword;
    await student.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to change password', error: error.message });
  }
};

const getRoomInfo = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate({
      path: 'room',
      select: 'roomNumber blockName floorNumber capacity occupiedBeds status',
    });

    if (!student || !student.room) {
      return res.status(404).json({ success: false, message: 'Room information not available' });
    }

    return res.status(200).json({ success: true, room: student.room });
  } catch (error) {
    console.error('Get Room Info Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch room information', error: error.message });
  }
};

const submitLeaveRequest = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;

    if (!leaveType || !fromDate || !toDate || !reason) {
      return res.status(400).json({ success: false, message: 'All leave request fields are required' });
    }

    const student = await User.findById(req.user._id).populate('room');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const leaveRequest = await LeaveRequest.create({
      student: student._id,
      room: student.room ? student.room._id : null,
      leaveType,
      fromDate,
      toDate,
      reason,
      history: [{ status: 'Pending', changedBy: student._id, comment: 'Leave request submitted' }],
    });

    const studentHostel = student.hostelName || (student.room ? student.room.hostelName : '');
    const studentBlock = student.block || (student.room ? student.room.blockName : '');
    const warden = await User.findOne({
      role: 'warden',
      assignedHostel: studentHostel,
      assignedBlocks: studentBlock
    }) || await User.findOne({
      role: 'warden',
      assignedHostel: studentHostel
    }) || await User.findOne({ role: 'warden' });

    if (warden) {
      leaveRequest.warden = warden._id;
      await leaveRequest.save();
      await updateNotification(
        warden._id,
        'Leave',
        'New Leave Request',
        `A new leave request has been submitted by ${student.fullName}.`,
        leaveRequest._id,
        { student: student._id }
      );
    }

    await updateNotification(
      student._id,
      'Leave',
      'Leave Request Submitted',
      'Your leave request has been submitted and is pending warden review.',
      leaveRequest._id,
      { status: 'Pending' }
    );

    return res.status(201).json({ success: true, message: 'Leave request submitted successfully', leaveRequest });
  } catch (error) {
    console.error('Submit Leave Request Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to submit leave request', error: error.message });
  }
};

const getLeaveHistory = async (req, res) => {
  try {
    const leaveHistory = await LeaveRequest.find({ student: req.user._id })
      .populate({ path: 'warden', select: 'fullName email' })
      .populate({ path: 'approvedBy rejectedBy', select: 'fullName email' })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, leaveHistory });
  } catch (error) {
    console.error('Get Leave History Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve leave history', error: error.message });
  }
};

const updateLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, fromDate, toDate, reason } = req.body;

    const leaveRequest = await LeaveRequest.findOne({ _id: id, student: req.user._id });
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending leave requests can be edited' });
    }

    const updates = {};
    if (leaveType) updates.leaveType = leaveType;
    if (fromDate) updates.fromDate = fromDate;
    if (toDate) updates.toDate = toDate;
    if (reason) updates.reason = reason;

    Object.assign(leaveRequest, updates);
    leaveRequest.history.push({ status: 'Pending', changedBy: req.user._id, comment: 'Leave request edited by student' });
    await leaveRequest.save();

    return res.status(200).json({ success: true, message: 'Leave request updated successfully', leaveRequest });
  } catch (error) {
    console.error('Update Leave Request Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update leave request', error: error.message });
  }
};

const cancelLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveRequest = await LeaveRequest.findOne({ _id: id, student: req.user._id });
    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending leave requests can be cancelled' });
    }

    leaveRequest.status = 'Cancelled';
    leaveRequest.history.push({ status: 'Cancelled', changedBy: req.user._id, comment: 'Leave request cancelled by student' });
    await leaveRequest.save();

    await updateNotification(
      req.user._id,
      'Leave',
      'Leave Request Cancelled',
      'Your leave request has been cancelled successfully.',
      leaveRequest._id,
      { status: 'Cancelled' }
    );

    return res.status(200).json({ success: true, message: 'Leave request cancelled successfully', leaveRequest });
  } catch (error) {
    console.error('Cancel Leave Request Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to cancel leave request', error: error.message });
  }
};

const submitComplaint = async (req, res) => {
  try {
    const { category, title, description, priority } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ success: false, message: 'Complaint category, title, and description are required' });
    }

    const student = await User.findById(req.user._id).populate('room');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const complaint = await Complaint.create({
      student: student._id,
      category,
      title,
      description,
      priority: priority || 'Medium',
      history: [{ status: 'Pending', changedBy: student._id, comment: 'Complaint submitted' }],
    });

    const studentHostel = student.hostelName || (student.room ? student.room.hostelName : '');
    const studentBlock = student.block || (student.room ? student.room.blockName : '');
    const warden = await User.findOne({
      role: 'warden',
      assignedHostel: studentHostel,
      assignedBlocks: studentBlock
    }) || await User.findOne({
      role: 'warden',
      assignedHostel: studentHostel
    }) || await User.findOne({ role: 'warden' });

    if (warden) {
      complaint.warden = warden._id;
      await complaint.save();
      await updateNotification(
        warden._id,
        'Complaint',
        'New Complaint Submitted',
        `A new complaint has been submitted by ${student.fullName}.`,
        complaint._id,
        { student: student._id }
      );
    }

    await updateNotification(
      req.user._id,
      'Complaint',
      'Complaint Submitted',
      'Your complaint has been logged and is awaiting warden review.',
      complaint._id,
      { status: 'Pending' }
    );

    return res.status(201).json({ success: true, message: 'Complaint submitted successfully', complaint });
  } catch (error) {
    console.error('Submit Complaint Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to submit complaint', error: error.message });
  }
};

const getComplaintsHistory = async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id })
      .populate({ path: 'warden', select: 'fullName email' })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, complaints });
  } catch (error) {
    console.error('Get Complaints History Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve complaint history', error: error.message });
  }
};

const submitVisitorRequest = async (req, res) => {
  try {
    const { visitorName, relationship, phoneNumber, visitDate, expectedArrivalTime } = req.body;

    if (!visitorName || !relationship || !phoneNumber || !visitDate || !expectedArrivalTime) {
      return res.status(400).json({ success: false, message: 'All visitor request fields are required' });
    }

    const student = await User.findById(req.user._id).populate('room');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const request = await VisitorRequest.create({
      student: student._id,
      visitorName,
      relationship,
      phoneNumber,
      visitDate,
      expectedArrivalTime,
      history: [{ status: 'Pending', changedBy: student._id, comment: 'Visitor request submitted' }],
    });

    const studentHostel = student.hostelName || (student.room ? student.room.hostelName : '');
    const studentBlock = student.block || (student.room ? student.room.blockName : '');
    const warden = await User.findOne({
      role: 'warden',
      assignedHostel: studentHostel,
      assignedBlocks: studentBlock
    }) || await User.findOne({
      role: 'warden',
      assignedHostel: studentHostel
    }) || await User.findOne({ role: 'warden' });

    if (warden) {
      request.warden = warden._id;
      await request.save();
      await updateNotification(
        warden._id,
        'Visitor',
        'New Visitor Request',
        `A new visitor request has been submitted by ${student.fullName}.`,
        request._id,
        { student: student._id }
      );
    }

    await updateNotification(
      req.user._id,
      'Visitor',
      'Visitor Request Submitted',
      'Your visitor request is pending warden approval.',
      request._id,
      { status: 'Pending' }
    );

    return res.status(201).json({ success: true, message: 'Visitor request submitted successfully', visitorRequest: request });
  } catch (error) {
    console.error('Submit Visitor Request Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to submit visitor request', error: error.message });
  }
};

const getVisitorHistory = async (req, res) => {
  try {
    const visitorRequests = await VisitorRequest.find({ student: req.user._id })
      .populate({ path: 'warden', select: 'fullName email' })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, visitorRequests });
  } catch (error) {
    console.error('Get Visitor History Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve visitor history', error: error.message });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      visibleTo: 'student',
      isPublished: true,
    })
      .populate({ path: 'postedBy', select: 'fullName email role' })
      .sort({ pinned: -1, createdAt: -1 });

    return res.status(200).json({ success: true, announcements });
  } catch (error) {
    console.error('Get Announcements Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to retrieve announcements', error: error.message });
  }
};

const getDashboardOverview = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).populate({
      path: 'room',
      select: 'roomNumber',
    });

    const pendingLeaveRequestsCount = await LeaveRequest.countDocuments({ student: req.user._id, status: 'Pending' });
    const activeComplaintsCount = await Complaint.countDocuments({
      student: req.user._id,
      status: { $in: ['Pending', 'In Progress'] },
    });
    const visitorRequestsCount = await VisitorRequest.countDocuments({ student: req.user._id, status: 'Pending' });
    const latestAnnouncementsCount = await Announcement.countDocuments({
      visibleTo: 'student',
      isPublished: true,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    return res.status(200).json({
      success: true,
      overview: {
        studentName: student.fullName,
        roomNumber: student.room ? student.room.roomNumber : null,
        pendingLeaveRequestsCount,
        activeComplaintsCount,
        visitorRequestsCount,
        latestAnnouncementsCount,
      },
    });
  } catch (error) {
    console.error('Get Dashboard Overview Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to build dashboard overview', error: error.message });
  }
};

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

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  changePassword,
  getRoomInfo,
  submitLeaveRequest,
  getLeaveHistory,
  updateLeaveRequest,
  cancelLeaveRequest,
  submitComplaint,
  getComplaintsHistory,
  submitVisitorRequest,
  getVisitorHistory,
  getAnnouncements,
  getDashboardOverview,
  getNotifications,
  markNotificationRead,
};
