const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const studentController = require('../controllers/studentController');

router.use(protect, authorizeRoles('student'));

router.get('/profile', studentController.getStudentProfile);
router.put('/profile', studentController.updateStudentProfile);
router.put('/change-password', studentController.changePassword);
router.get('/room', studentController.getRoomInfo);
router.post('/leave', studentController.submitLeaveRequest);
router.get('/leave/history', studentController.getLeaveHistory);
router.put('/leave/:id', studentController.updateLeaveRequest);
router.delete('/leave/:id', studentController.cancelLeaveRequest);
router.post('/complaint', studentController.submitComplaint);
router.get('/complaint/history', studentController.getComplaintsHistory);
router.post('/visitor', studentController.submitVisitorRequest);
router.get('/visitor/history', studentController.getVisitorHistory);
router.get('/announcements', studentController.getAnnouncements);
router.get('/overview', studentController.getDashboardOverview);
router.get('/notifications', studentController.getNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);

module.exports = router;
