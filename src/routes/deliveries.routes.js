const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');
const ctrl = require('../controllers/deliveries.controller');

// Routes TRANSPORTER
/**
 * @swagger
 * tags:
 *   name: Deliveries
 *   description: Marché des livraisons et appels d'offres
 */

// Routes TRANSPORTER

/**
 * @swagger
 * /api/deliveries/available:
 *   get:
 *     summary: Liste des missions de livraison disponibles (TRANSPORTER)
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/available',           verifyToken, requireRole('TRANSPORTER'), ctrl.getAvailableMissions);

/**
 * @swagger
 * /api/deliveries/{orderId}/offer:
 *   post:
 *     summary: Soumettre une offre de prix pour une livraison (TRANSPORTER)
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:orderId/offer',     verifyToken, requireRole('TRANSPORTER'), ctrl.submitOffer);

/**
 * @swagger
 * /api/deliveries/offers/{offerId}:
 *   delete:
 *     summary: Retirer une offre de livraison
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.delete('/offers/:offerId',  verifyToken, requireRole('TRANSPORTER'), ctrl.withdrawOffer);

/**
 * @swagger
 * /api/deliveries/offers/mine:
 *   get:
 *     summary: Voir mes offres de livraison soumises
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/offers/mine',         verifyToken, requireRole('TRANSPORTER'), ctrl.getMyOffers);

/**
 * @swagger
 * /api/deliveries/mine:
 *   get:
 *     summary: Voir mes livraisons en cours (assignées)
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/mine',                verifyToken, requireRole('TRANSPORTER'), ctrl.getMyDeliveries);

/**
 * @swagger
 * /api/deliveries/{orderId}/status:
 *   patch:
 *     summary: Mettre à jour le statut de la livraison (IN_TRANSIT, DELIVERED)
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/:orderId/status',   verifyToken, requireRole('TRANSPORTER'), ctrl.updateStatus);

// Routes BUYER

/**
 * @swagger
 * /api/deliveries/orders/{orderId}/offers:
 *   get:
 *     summary: Voir les offres de transporteurs pour ma commande (BUYER)
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/orders/:orderId/offers', verifyToken, ctrl.getOrderOffers);

/**
 * @swagger
 * /api/deliveries/offers/{offerId}/accept:
 *   post:
 *     summary: Accepter l'offre d'un transporteur (BUYER)
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/offers/:offerId/accept',verifyToken, ctrl.acceptOffer);

/**
 * @swagger
 * /api/deliveries/offers/{offerId}/reject:
 *   post:
 *     summary: Rejeter l'offre d'un transporteur (BUYER)
 *     tags: [Deliveries]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/offers/:offerId/reject',verifyToken, ctrl.rejectOffer);

module.exports = router;
