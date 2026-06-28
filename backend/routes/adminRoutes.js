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

module.exports = router;
