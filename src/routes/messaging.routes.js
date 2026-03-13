const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/messaging.controller');

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Messaging
 *   description: Messagerie instantanée et négociation de prix
 */

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Démarrer ou récupérer une conversation
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/',                      ctrl.startConversation);

/**
 * @swagger
 * /api/conversations/mine:
 *   get:
 *     summary: Liste de mes conversations
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/mine',                   ctrl.getMyConversations);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Liste des messages d'une conversation
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id/messages',           ctrl.getMessages);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   post:
 *     summary: Envoyer un message texte
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/messages',          ctrl.sendMessage);

/**
 * @swagger
 * /api/conversations/{id}/price-offer:
 *   post:
 *     summary: Envoyer une offre de prix (négociation)
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/price-offer',       ctrl.sendPriceOffer);

/**
 * @swagger
 * /api/conversations/messages/{msgId}/respond:
 *   patch:
 *     summary: Accepter ou refuser une offre de prix
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/messages/:msgId/respond', ctrl.respondToOffer);

module.exports = router;
