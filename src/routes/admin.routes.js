const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');
const ctrl = require('../controllers/admin.controller');

// Toutes les routes admin sont protégées ADMIN
router.use(verifyToken, requireRole('ADMIN'));

router.get('/stats',                               ctrl.getStats);
router.get('/users',                               ctrl.getUsers);
router.get('/users/:id',                           ctrl.getUserById);
router.patch('/users/:id',                         ctrl.updateUser);
router.patch('/users/:id/status',                ctrl.updateUserStatus);
router.delete('/users/:id',                        ctrl.deleteUser);
router.post('/users',                               ctrl.createUser);
router.get('/products',                            ctrl.getProducts);
router.patch('/products/:id/hide',                 ctrl.hideProduct);
router.patch('/products/:id/status',               ctrl.updateProductStatus);
router.get('/orders',                              ctrl.getOrders);
router.get('/orders/:id',                          ctrl.getOrderById);
router.patch('/orders/:id',                        ctrl.updateStatus); // Re-use general status update
router.get('/disputes',                            ctrl.getDisputes);
router.post('/disputes/:id/resolve',               ctrl.resolveDispute);
router.get('/payments',                            ctrl.getPayments);
router.post('/payments/:id/release',               ctrl.releaseFunds);
router.patch('/payments/withdrawals/:id/validate', ctrl.validateWithdrawal);

// Settings and Infra
const settingsCtrl = require('../controllers/settings.controller');
router.get('/settings',      settingsCtrl.getSettings);
router.patch('/settings',    settingsCtrl.updateSettings);
router.post('/infra/:action', settingsCtrl.runInfraAction);

module.exports = router;
