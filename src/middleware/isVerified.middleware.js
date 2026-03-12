/**
 * requireVerified — Vérifie que l'email est vérifié
 */
const requireVerified = (req, res, next) => {
  if (!req.user?.isVerified)
    return res.status(403).json({
      message: 'Veuillez vérifier votre email avant de continuer',
      code: 'EMAIL_NOT_VERIFIED',
    });
  next();
};

module.exports = { requireVerified };
