const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { getDefaultCapabilities } = require('../utils/capabilities');
const { sendOtpEmail, sendPasswordResetEmail } = require('../services/email.service');

const generateOTP   = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateToken = (user) => jwt.sign(
  { sub: user._id, email: user.email, role: user.role, canSell: user.canSell, canBuy: user.canBuy, isVerified: user.isVerified },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRATION || '7d' }
);

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'BUYER' } = req.body;
    if (!['FARMER','BUYER','TRANSPORTER'].includes(role))
      return res.status(400).json({ message: 'Rôle invalide' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé' });

    const passwordHash  = await bcrypt.hash(password, 12);
    const capabilities  = getDefaultCapabilities(role);
    const otp           = generateOTP();
    const otpHash       = await bcrypt.hash(otp, 10);
    const otpExpires    = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await User.create({
      email, passwordHash, firstName, lastName, phone, role,
      ...capabilities, otpCode: otpHash, otpExpires, otpAttempts: 0
    });

    await sendOtpEmail(email, firstName, otp);
    const token = generateToken(user);
    res.status(201).json({ message: 'Compte créé. Vérifiez votre email.', access_token: token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.sub);
    if (!user.otpCode)           return res.status(400).json({ message: 'Aucun OTP en cours' });
    if (new Date() > user.otpExpires) return res.status(400).json({ message: 'OTP expiré. Demandez-en un nouveau.' });
    if (user.otpAttempts >= 3)   return res.status(400).json({ message: 'Trop de tentatives. Demandez un nouvel OTP.' });

    const isValid = await bcrypt.compare(otp, user.otpCode);
    if (!isValid) {
      await User.findByIdAndUpdate(user._id, { $inc: { otpAttempts: 1 } });
      return res.status(400).json({ message: `Code incorrect. ${2 - user.otpAttempts} tentative(s) restante(s).` });
    }

    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      $unset: { otpCode: '', otpExpires: '', otpAttempts: '' }
    });
    const updatedUser = await User.findById(user._id);
    const token = generateToken(updatedUser);
    res.json({ message: 'Email vérifié avec succès ✅', access_token: token, user: updatedUser.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /auth/resend-otp
exports.resendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (user.isVerified) return res.status(400).json({ message: 'Email déjà vérifié' });
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await User.findByIdAndUpdate(user._id, { otpCode: otpHash, otpExpires, otpAttempts: 0 });
    await sendOtpEmail(user.email, user.firstName, otp);
    res.json({ message: 'Nouvel OTP envoyé. Vérifiez votre email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /auth/change-email
exports.changeEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(newEmail)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé par un autre compte' });

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { 
        email: newEmail.toLowerCase(), 
        isVerified: false, 
        otpCode: otpHash, 
        otpExpires, 
        otpAttempts: 0 
      },
      { new: true }
    );

    await sendOtpEmail(user.email, user.firstName, otp);
    res.json({ message: 'Email mis à jour. Nouveau code envoyé.', user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)          return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    if (!user.isActive) return res.status(403).json({ message: 'Compte suspendu' });
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    const token = generateToken(user);
    res.json({ access_token: token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'Si cet email existe, un OTP vous a été envoyé.' });
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await User.findByIdAndUpdate(user._id, { resetPasswordToken: otpHash, resetPasswordExpires: otpExpires });
    await sendPasswordResetEmail(email, user.firstName, otp);
    res.json({ message: 'Si cet email existe, un OTP vous a été envoyé.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user?.resetPasswordToken)  return res.status(400).json({ message: 'OTP invalide ou expiré' });
    if (new Date() > user.resetPasswordExpires) return res.status(400).json({ message: 'OTP expiré' });
    const isValid = await bcrypt.compare(otp, user.resetPasswordToken);
    if (!isValid) return res.status(400).json({ message: 'OTP incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, {
      passwordHash, $unset: { resetPasswordToken: '', resetPasswordExpires: '' }
    });
    res.json({ message: 'Mot de passe réinitialisé avec succès ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /auth/capabilities
exports.updateCapabilities = async (req, res) => {
  try {
    const { canSell, canBuy } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { ...(canSell !== undefined && { canSell }), ...(canBuy !== undefined && { canBuy }) },
      { new: true }
    );
    const token = generateToken(user);
    res.json({ message: 'Capacités mises à jour', access_token: token, user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, city, address, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { 
        ...(firstName && { firstName }), 
        ...(lastName && { lastName }), 
        ...(phone && { phone }),
        ...(city && { city }),
        ...(address && { address }),
        ...(bio && { bio })
      },
      { new: true }
    );
    res.json({ message: 'Profil mis à jour 🎉', user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
