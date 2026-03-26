const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');

const { verifyToken } = require('../middleware/auth.middleware');

// Handle /users?role=FARMER
router.get('/', ctrl.getUsers);

// Generic user actions
const userCtrl = require('../controllers/user.controller');
router.post('/:id/rate', verifyToken, userCtrl.rateUser);

module.exports = router;
