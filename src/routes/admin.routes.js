const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/roles.middleware');
const ctrl = require('../controllers/admin.controller');

router.use(verifyToken, requireRole('ADMIN')); // Protégé

router.get('/stats',                  ctrl.getStats);
router.get('/users',                  ctrl.getUsers);
router.post('/disputes/:id/resolve',  ctrl.resolveDispute);

module.exports = router;
