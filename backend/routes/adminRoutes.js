const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

router.use(protect, authorizeRoles('admin'));

router.post('/announcements', adminController.createAnnouncement);
router.get('/announcements', adminController.listAnnouncements);
router.post('/rooms', adminController.createRoom);
router.get('/rooms', adminController.listRooms);

// Student CRUD
router.post('/students', adminController.createStudent);
router.get('/students', adminController.listStudents);
router.get('/students/:id', adminController.getStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.put('/students/:id/reset-password', adminController.resetStudentPassword);

// Warden CRUD
router.post('/wardens', adminController.createWarden);
router.get('/wardens', adminController.listWardens);
router.get('/wardens/:id', adminController.getWarden);
router.put('/wardens/:id', adminController.updateWarden);
router.delete('/wardens/:id', adminController.deleteWarden);
router.put('/wardens/:id/reset-password', adminController.resetWardenPassword);

// Leave Requests Management
router.get('/leaves', adminController.listLeaveRequests);
router.put('/leaves/:id', adminController.reviewLeaveRequest);

// Complaints Management
router.get('/complaints', adminController.listComplaints);
router.put('/complaints/:id/status', adminController.updateComplaintStatus);

// Visitor Requests Management
router.get('/visitors', adminController.listVisitorRequests);
router.post('/visitors/on-the-spot', adminController.registerVisitorOnTheSpot);
router.put('/visitors/:id', adminController.reviewVisitorRequest);

// Admin Settings and Profile
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);
router.put('/change-password', adminController.changeAdminPassword);

module.exports = router;
