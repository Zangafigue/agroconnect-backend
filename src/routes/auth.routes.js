const router = require('express').Router();
const { verifyToken }   = require('../middleware/auth.middleware');
const ctrl = require('../controllers/auth.controller');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification et gestion des comptes
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Créer un nouveau compte utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, role]
 *             properties:
 *               email: { type: string, example: "farmer@agroconnect.bf" }
 *               password: { type: string, example: "Password123!" }
 *               firstName: { type: string, example: "Boureima" }
 *               lastName: { type: string, example: "Sawadogo" }
 *               phone: { type: string, example: "+22601020304" }
 *               role: { type: string, enum: [FARMER, BUYER, TRANSPORTER] }
 *     responses:
 *       201:
 *         description: Compte créé, OTP envoyé par email
 */
router.post('/register',        ctrl.register);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Vérifier l'email avec le code OTP
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp: { type: string, example: "123456" }
 */
router.post('/verify-otp',      verifyToken, ctrl.verifyOtp);

/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Renvoyer un nouveau code OTP
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
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

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Demander la réinitialisation du mot de passe
 *     tags: [Auth]
 */
router.post('/forgot-password', ctrl.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe avec l'OTP
 *     tags: [Auth]
 */
router.post('/reset-password',  ctrl.resetPassword);

/**
 * @swagger
 * /api/auth/capabilities:
 *   patch:
 *     summary: Mettre à jour les capacités (Vendeur/Acheteur) d'un utilisateur
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.patch('/capabilities',   verifyToken, ctrl.updateCapabilities);

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
