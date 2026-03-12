/**
 * Retourne les capacités par défaut selon le rôle
 */
const getDefaultCapabilities = (role) => {
  switch (role) {
    case 'FARMER':      return { canSell: true,  canBuy: true  };
    case 'BUYER':       return { canSell: false,  canBuy: true  };
    case 'TRANSPORTER': return { canSell: false,  canBuy: true  };
    case 'ADMIN':       return { canSell: false,  canBuy: false };
    default:            return { canSell: false,  canBuy: false };
  }
};

module.exports = { getDefaultCapabilities };
