const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireCapability } = require('../middleware/capabilities.middleware');
const ctrl = require('../controllers/order.controller');

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestion des commandes et transactions
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Créer une nouvelle commande (BUYER)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/',      ctrl.createOrder);
router.get('/',       ctrl.getOrders); // Unified route

/**
 * @swagger
 * /api/orders/buyer/mine:
 *   get:
 *     summary: Voir mes commandes en tant qu'acheteur
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/buyer/mine',   ctrl.getMyOrdersBuyer);

/**
 * @swagger
 * /api/orders/seller/mine:
 *   get:
 *     summary: Voir mes commandes en tant que vendeur
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/seller/mine',  ctrl.getMyOrdersSeller);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Détails d'une commande
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id',    ctrl.getOrderById);

/**
 * @swagger
 * /api/orders/{id}/confirm:
 *   post:
 *     summary: Confirmer une commande et définir l'adresse de collecte (FARMER)
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/confirm', requireCapability('canSell'), ctrl.confirmOrder);

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   post:
 *     summary: Annuler une commande
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/cancel',  ctrl.cancelOrder);

/**
 * @swagger
 * /api/orders/{id}/position:
 *   patch:
 *     summary: Mettre à jour la position GPS du transporteur
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:id/position', requireCapability('canDeliver'), ctrl.updateTransporterPosition);
router.patch('/:id/status',   ctrl.updateStatus); 
router.patch('/:id/pay',      ctrl.payOrder);
router.post('/:orderId/offers', requireCapability('canDeliver'), require('../controllers/transporter.controller').submitOffer);

module.exports = router;
