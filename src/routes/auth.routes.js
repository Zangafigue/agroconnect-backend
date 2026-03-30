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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Se connecter à la plateforme
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "farmer@agroconnect.bf" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200:
 *         description: Succès, retourne le JWT
 */
router.post('/login',           ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);
router.patch('/capabilities',   verifyToken, ctrl.updateCapabilities);
router.patch('/profile',        verifyToken, ctrl.updateProfile);
router.post('/change-password', verifyToken, ctrl.changePassword);
router.post('/profile/picture', verifyToken, require('../middleware/upload.middleware').single('avatar'), async (req, res) => {
  try {
    const User = require('../models/User');
    const profilePicture = req.file.path; // Supports both local path and Cloudinary URL
    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { profilePicture },
      { new: true }
    );
    res.json({ message: 'Image mise à jour', profilePicture, user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtenir les infos du compte connecté
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.get('/me', verifyToken, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.sub);
  res.json(user?.toJSON());
});

module.exports = router;
