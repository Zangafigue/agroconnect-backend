const router = require('express').Router();
const { verifyToken }   = require('../middleware/auth.middleware');
const { requireVerified}= require('../middleware/isVerified.middleware');
const ctrl = require('../controllers/payments.controller');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestion des transactions, portefeuilles et retraits
 */

/**
 * @swagger
 * /api/payments/initiate/{orderId}:
 *   post:
 *     summary: Initier manuellement un paiement pour une commande
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/initiate/:orderId',      verifyToken, requireVerified, ctrl.initiatePayment);

/**
 * @swagger
 * /api/payments/confirm/{paymentId}:
 *   post:
 *     summary: Confirmer un paiement (Simulation / Webhook)
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/confirm/:paymentId',     verifyToken, ctrl.confirmPayment);

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: Récupérer les infos de paiement d'une commande
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/order/:orderId',          verifyToken, ctrl.getPaymentByOrder);

/**
 * @swagger
 * /api/payments/wallet:
 *   get:
 *     summary: Consulter solde du portefeuille et gains
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/wallet',                  verifyToken, ctrl.getWallet);

/**
 * @swagger
 * /api/payments/withdraw:
 *   post:
 *     summary: Demander un retrait de fonds
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/withdraw',               verifyToken, ctrl.requestWithdrawal);

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Historique des transactions
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/history',                 verifyToken, ctrl.getHistory);

module.exports = router;
