const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');
const ctrl = require('../controllers/order.controller');

router.use(verifyToken);

router.post('/',      ctrl.createOrder);
router.get('/buyer/mine',   ctrl.getMyOrdersBuyer);
router.get('/seller/mine',  ctrl.getMyOrdersSeller);
router.get('/:id',    ctrl.getOrderById);
router.post('/:id/confirm', requireRole('FARMER'), ctrl.confirmOrder);
router.post('/:id/cancel',  ctrl.cancelOrder);
router.patch('/:id/position', requireRole('TRANSPORTER'), ctrl.updateTransporterPosition);

module.exports = router;
