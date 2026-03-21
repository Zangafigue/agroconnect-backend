const jwt = require('jsonwebtoken');

/**
 * verifyToken - Middleware JWT Bearer
 * Vérifie le token et charge req.user
 */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
};

module.exports = { verifyToken };
