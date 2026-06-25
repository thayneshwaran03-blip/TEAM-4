const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const wardenController = require('../controllers/wardenController');

router.use(protect, authorizeRoles('warden'));

router.get('/dashboard', wardenController.getWardenDashboard);
router.get('/leave-requests', wardenController.listLeaveRequests);
router.put('/leave-requests/:id', wardenController.reviewLeaveRequest);
router.get('/complaints', wardenController.listComplaints);
router.put('/complaints/:id/status', wardenController.updateComplaintStatus);
router.get('/visitor-requests', wardenController.listVisitorRequests);
router.put('/visitor-requests/:id', wardenController.reviewVisitorRequest);

module.exports = router;
