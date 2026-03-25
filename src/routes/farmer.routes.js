const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/farmer.controller');

router.use(verifyToken);

router.get('/stats',          ctrl.getStats);
router.get('/orders',         ctrl.getOrders);
router.get('/orders/active',  ctrl.getActiveOrders);
router.patch('/orders/:id/status', ctrl.updateOrderStatus);

module.exports = router;
