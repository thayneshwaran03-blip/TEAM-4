const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const wardenController = require('../controllers/wardenController');

router.use(protect, authorizeRoles('warden'));

// Overview
router.get('/dashboard', wardenController.getWardenDashboard);

// Leave Requests
router.get('/leave-requests', wardenController.listLeaveRequests);
router.put('/leave-requests/:id', wardenController.reviewLeaveRequest);

// Complaints
router.get('/complaints', wardenController.listComplaints);
router.put('/complaints/:id/status', wardenController.updateComplaintStatus);

// Visitor Requests
router.get('/visitor-requests', wardenController.listVisitorRequests);
router.post('/visitor-requests/on-the-spot', wardenController.registerVisitorOnTheSpot);
router.put('/visitor-requests/:id', wardenController.reviewVisitorRequest);

// Student Management
router.get('/students', wardenController.listStudents);

// Warden Profile & settings
router.get('/profile', wardenController.getWardenProfile);
router.put('/profile', wardenController.updateWardenProfile);
router.put('/change-password', wardenController.changeWardenPassword);

// Notifications
router.get('/notifications', wardenController.getNotifications);
router.put('/notifications/:id/read', wardenController.markNotificationRead);

// Announcements CRUD
router.post('/announcements', wardenController.createAnnouncement);
router.get('/announcements', wardenController.listAnnouncements);
router.put('/announcements/:id', wardenController.updateAnnouncement);
router.delete('/announcements/:id', wardenController.deleteAnnouncement);

// Room Management
router.get('/rooms', wardenController.listRooms);
router.put('/students/:studentId/allocate-room', wardenController.allocateRoom);

// Occupancy Report
router.get('/occupancy/dashboard', wardenController.getWardenOccupancyDashboard);
router.get('/occupancy/report', wardenController.getWardenOccupancyReport);
router.get('/occupancy/export', wardenController.getWardenOccupancyExport);

module.exports = router;
