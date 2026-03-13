const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/disputes.controller');

router.use(verifyToken);

router.post('/',      ctrl.createDispute);
router.get('/mine',   ctrl.getMyDisputes);

module.exports = router;
