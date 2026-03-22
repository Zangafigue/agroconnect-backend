const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');

router.use(protect);
router.use(requireRole('ADMIN'));

router.get('/', notificationController.getAdminNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
