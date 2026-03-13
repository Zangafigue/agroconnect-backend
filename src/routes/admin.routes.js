const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');
const ctrl = require('../controllers/admin.controller');

router.use(verifyToken, requireRole('ADMIN')); // Protégé

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Console d'administration (Réservé aux ADMIN)
 */

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Statistiques globales de la plateforme
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/stats',                  ctrl.getStats);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Liste de tous les utilisateurs
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/users',                  ctrl.getUsers);

/**
 * @swagger
 * /api/admin/disputes/{id}/resolve:
 *   post:
 *     summary: Résoudre un litige et prendre une décision financière
 *     tags: [Admin]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/disputes/:id/resolve',  ctrl.resolveDispute);

module.exports = router;
