const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');

// Handle /users?role=FARMER
router.get('/', ctrl.getUsers);

module.exports = router;
