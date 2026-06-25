const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const VisitorRequest = require('../models/VisitorRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');

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
      .populate({ path: 'student', select: 'fullName email phoneNumber room' })
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

module.exports = {
  getWardenDashboard,
  listLeaveRequests,
  reviewLeaveRequest,
  listComplaints,
  updateComplaintStatus,
  listVisitorRequests,
  reviewVisitorRequest,
};
