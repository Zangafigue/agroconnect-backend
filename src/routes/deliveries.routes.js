const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');
const ctrl = require('../controllers/deliveries.controller');

// Routes TRANSPORTER
router.get('/available',           verifyToken, requireRole('TRANSPORTER'), ctrl.getAvailableMissions);
router.post('/:orderId/offer',     verifyToken, requireRole('TRANSPORTER'), ctrl.submitOffer);
router.delete('/offers/:offerId',  verifyToken, requireRole('TRANSPORTER'), ctrl.withdrawOffer);
router.get('/offers/mine',         verifyToken, requireRole('TRANSPORTER'), ctrl.getMyOffers);
router.get('/mine',                verifyToken, requireRole('TRANSPORTER'), ctrl.getMyDeliveries);
router.patch('/:orderId/status',   verifyToken, requireRole('TRANSPORTER'), ctrl.updateStatus);

// Routes BUYER
router.get('/orders/:orderId/offers', verifyToken, ctrl.getOrderOffers);
router.post('/offers/:offerId/accept',verifyToken, ctrl.acceptOffer);
router.post('/offers/:offerId/reject',verifyToken, ctrl.rejectOffer);

module.exports = router;
