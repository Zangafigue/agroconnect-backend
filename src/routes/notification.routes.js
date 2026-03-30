const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');

router.use(verifyToken);

// Routes Utilisateurs (Mobile/Web)
router.get('/mine', notificationController.getMyNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markAsRead);

// Routes ADMIN
router.get('/admin', requireRole('ADMIN'), notificationController.getAdminNotifications);
router.delete('/:id', requireRole('ADMIN'), notificationController.deleteNotification);

module.exports = router;
