const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/disputes.controller');

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Disputes
 *   description: Gestion des litiges et réclamations
 */

/**
 * @swagger
 * /api/disputes:
 *   post:
 *     summary: Ouvrir un nouveau litige sur une commande
 *     tags: [Disputes]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/',      ctrl.createDispute);

/**
 * @swagger
 * /api/disputes/mine:
 *   get:
 *     summary: Liste de mes litiges (ouverts ou reçus)
 *     tags: [Disputes]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/mine',   ctrl.getMyDisputes);

module.exports = router;
