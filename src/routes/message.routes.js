const router = require('express').Router();
const { verifyToken }   = require('../middleware/auth.middleware');
const { requireVerified}= require('../middleware/isVerified.middleware');
const ctrl = require('../controllers/message.controller');

router.get('/',                          verifyToken, ctrl.getMyConversations);
router.post('/',                         verifyToken, requireVerified, ctrl.createOrGetConversation);
router.get('/:id/messages',             verifyToken, ctrl.getMessages);
router.post('/:id/messages',            verifyToken, ctrl.sendMessage);
router.post('/:id/price-offer',         verifyToken, ctrl.sendPriceOffer);
router.patch('/messages/:msgId/respond',verifyToken, ctrl.respondToOffer);
router.patch('/:id/read',               verifyToken, ctrl.markAsRead);

module.exports = router;
