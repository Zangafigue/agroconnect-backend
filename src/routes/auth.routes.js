const router = require('express').Router();
const { verifyToken }   = require('../middleware/auth.middleware');
const ctrl = require('../controllers/auth.controller');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification et gestion des comptes
 */

router.post('/register',        ctrl.register);
router.post('/verify-otp',      verifyToken, ctrl.verifyOtp);
router.post('/resend-otp',      verifyToken, ctrl.resendOtp);
router.post('/login',           ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);
router.patch('/capabilities',   verifyToken, ctrl.updateCapabilities);
router.get('/me', verifyToken, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.sub);
  res.json(user?.toJSON());
});

module.exports = router;
