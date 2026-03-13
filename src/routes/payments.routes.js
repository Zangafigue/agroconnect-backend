const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/payments.controller');

router.use(verifyToken);

router.post('/initiate', ctrl.initiateOrderPayment);
router.get('/mine', ctrl.getMyPayments);
router.get('/:id', ctrl.getPaymentDetails);

module.exports = router;
