const router = require('express').Router();
const { verifyToken }   = require('../middleware/auth.middleware');
const { requireVerified}= require('../middleware/isVerified.middleware');
const ctrl = require('../controllers/dispute.controller');

router.post('/',  verifyToken, requireVerified, ctrl.createDispute);
router.get('/mine', verifyToken, ctrl.getMyDisputes);
router.get('/:id',  verifyToken, ctrl.getDisputeById);

module.exports = router;
