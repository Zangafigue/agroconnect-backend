const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/messaging.controller');

router.use(verifyToken);

router.post('/',                      ctrl.startConversation);
router.get('/mine',                   ctrl.getMyConversations);
router.get('/:id/messages',           ctrl.getMessages);
router.post('/:id/messages',          ctrl.sendMessage);
router.post('/:id/price-offer',       ctrl.sendPriceOffer);
router.patch('/messages/:msgId/respond', ctrl.respondToOffer);

module.exports = router;
