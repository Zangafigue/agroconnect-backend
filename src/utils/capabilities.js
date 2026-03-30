/**
 * Retourne les capacités par défaut selon le rôle
 */
const getDefaultCapabilities = (role) => {
  switch (role) {
    case 'FARMER':      return { canSell: true,  canBuy: true,  canDeliver: false };
    case 'BUYER':       return { canSell: false, canBuy: true,  canDeliver: false };
    case 'TRANSPORTER': return { canSell: false, canBuy: true,  canDeliver: true  };
    case 'ADMIN':       return { canSell: true,  canBuy: true,  canDeliver: true  };
    default:            return { canSell: false, canBuy: true,  canDeliver: false };
  }
};

module.exports = { getDefaultCapabilities };
