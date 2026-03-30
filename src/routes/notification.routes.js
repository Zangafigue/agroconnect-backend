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
router.delete('/bulk', notificationController.deleteNotifications);
router.delete('/all', notificationController.deleteAllNotifications);
router.delete('/:id', notificationController.deleteNotification);

// Routes ADMIN
router.get('/admin', requireRole('ADMIN'), notificationController.getAdminNotifications);

module.exports = router;
