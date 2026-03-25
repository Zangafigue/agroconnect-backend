/**
 * guards - Middlewares de capacités dynamiques
 */

const requireCanBuy = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  if (!req.user.canBuy) 
    return res.status(403).json({ message: 'Achat non activé sur votre compte' });
  next();
};

const requireCanSell = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  if (!req.user.canSell) 
    return res.status(403).json({ message: 'Vente non activée (validation admin requise)' });
  next();
};

const requireCanDeliver = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  if (!req.user.canDeliver) 
    return res.status(403).json({ message: 'Livraison non activée sur votre compte' });
  next();
};

const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  if (req.user.role !== 'ADMIN') 
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  next();
};

module.exports = {
  requireCanBuy,
  requireCanSell,
  requireCanDeliver,
  isAdmin
};
