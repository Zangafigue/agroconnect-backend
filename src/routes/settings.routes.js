const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/settings.controller');

router.patch('/preferences', verifyToken, ctrl.updatePreferences);

module.exports = router;
