const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/buyer.controller');

router.use(verifyToken);

router.get('/stats',          ctrl.getStats);
router.get('/orders/active',  ctrl.getActiveOrders);

module.exports = router;
