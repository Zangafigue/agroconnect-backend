/**
 * requireCanSell — Vérifie que l'utilisateur peut vendre
 */
const requireCanSell = (req, res, next) => {
  if (!req.user?.canSell)
    return res.status(403).json({ message: 'Vous ne pouvez pas vendre sur cette plateforme' });
  next();
};

module.exports = { requireCanSell };
