const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications utilisateur
 */

/**
 * @swagger
 * /api/notifications/mine:
 *   get:
 *     summary: Liste de mes notifications
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/mine', ctrl.getMyNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/read', ctrl.markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/read-all', ctrl.markAllAsRead);

router.delete('/bulk', ctrl.deleteNotifications);
router.delete('/all', ctrl.deleteAllNotifications);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
