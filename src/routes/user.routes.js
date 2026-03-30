const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Handle /users?role=FARMER
router.get('/', verifyToken, ctrl.getUsers);

module.exports = router;
