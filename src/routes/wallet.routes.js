const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/wallet.controller');

router.get('/me', verifyToken, ctrl.getWallet);

module.exports = router;
