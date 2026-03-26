/**
 * requireCapability - Middleware de vérification des drapeaux de capacité (canSell, canBuy, canDeliver)
 * Ce middleware est utilisé à la place de requireRole pour le modèle de Compte Universel.
 */
const requireCapability = (capability) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  
  // L'admin a toutes les capacités par défaut
  if (req.user.role === 'ADMIN') return next();

  if (!req.user[capability]) {
    return res.status(403).json({ 
      message: `Action interdite : vous n'avez pas la capacité '${capability}' activée sur votre compte.` 
    });
  }
  
  next();
};

module.exports = { requireCapability };
