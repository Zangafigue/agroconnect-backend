const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');
const ctrl = require('../controllers/admin.controller');

// Toutes les routes admin sont protégées ADMIN
router.use(verifyToken, requireRole('ADMIN'));

router.get('/stats',                               ctrl.getStats);
router.get('/users',                               ctrl.getUsers);
router.get('/users/:id',                           ctrl.getUserById);
router.patch('/users/:id/suspend',                 ctrl.suspendUser);
router.patch('/users/:id/activate',                ctrl.activateUser);
router.get('/products',                            ctrl.getProducts);
router.patch('/products/:id/hide',                 ctrl.hideProduct);
router.get('/orders',                              ctrl.getOrders);
router.get('/disputes',                            ctrl.getDisputes);
router.post('/disputes/:id/resolve',               ctrl.resolveDispute);
router.get('/payments',                            ctrl.getPayments);
router.post('/payments/:id/release',               ctrl.releaseFunds);
router.patch('/payments/withdrawals/:id/validate', ctrl.validateWithdrawal);

module.exports = router;
