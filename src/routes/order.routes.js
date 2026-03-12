const router = require('express').Router();
const { verifyToken }   = require('../middleware/auth.middleware');
const { requireVerified}= require('../middleware/isVerified.middleware');
const ctrl = require('../controllers/order.controller');

router.post('/',                       verifyToken, requireVerified, ctrl.createOrder);
router.get('/my/buyer',               verifyToken, ctrl.getMyOrdersBuyer);
router.get('/my/seller',              verifyToken, ctrl.getMyOrdersSeller);
router.get('/:id',                    verifyToken, ctrl.getOrderById);
router.patch('/:id/confirm',          verifyToken, ctrl.confirmOrder);
router.patch('/:id/cancel',           verifyToken, ctrl.cancelOrder);
router.patch('/:id/transporter-position', verifyToken, ctrl.updateTransporterPosition);

module.exports = router;
