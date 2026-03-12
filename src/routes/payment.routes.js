const router = require('express').Router();
const { verifyToken }   = require('../middleware/auth.middleware');
const { requireVerified}= require('../middleware/isVerified.middleware');
const ctrl = require('../controllers/payment.controller');

router.post('/initiate/:orderId',      verifyToken, requireVerified, ctrl.initiatePayment);
router.post('/confirm/:paymentId',     verifyToken, ctrl.confirmPayment);
router.get('/order/:orderId',          verifyToken, ctrl.getPaymentByOrder);
router.get('/wallet',                  verifyToken, ctrl.getWallet);
router.post('/withdraw',               verifyToken, ctrl.requestWithdrawal);
router.get('/history',                 verifyToken, ctrl.getHistory);

module.exports = router;
