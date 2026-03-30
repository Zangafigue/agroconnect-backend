const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/messaging.controller');

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Messaging
 *   description: Système de messagerie et négociation de prix
 */

/**
 * @swagger
 * /api/conversations/mine:
 *   get:
 *     summary: Liste de mes conversations
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/mine', ctrl.getMyConversations);

/**
 * @swagger
 * /api/conversations:
 *   post:
 *     summary: Démarrer ou récupérer une conversation (Acheteur/Agriculteur)
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/', ctrl.startConversation);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   get:
 *     summary: Voir les messages d'une conversation
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id/messages', ctrl.getMessages);
router.patch('/:id/read', ctrl.markAsRead);

/**
 * @swagger
 * /api/conversations/{id}/messages:
 *   post:
 *     summary: Envoyer un message texte
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/messages', ctrl.sendMessage);

/**
 * @swagger
 * /api/conversations/{id}/price-offer:
 *   post:
 *     summary: Envoyer une offre de prix
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.post('/:id/price-offer', ctrl.sendPriceOffer);

/**
 * @swagger
 * /api/conversations/messages/{msgId}/respond:
 *   patch:
 *     summary: Répondre à une offre de prix (Accept/Reject)
 *     tags: [Messaging]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/messages/:msgId/respond', ctrl.respondToOffer);

router.delete('/messages/bulk', ctrl.deleteMessages);
router.delete('/delete/:id', ctrl.deleteConversation);

module.exports = router;
