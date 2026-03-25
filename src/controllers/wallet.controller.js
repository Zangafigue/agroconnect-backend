const User = require('../models/User');
const Payment = require('../models/Payment');

exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('walletBalance');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Fetch recent transactions for the wallet history
    const transactions = await Payment.find({ 
      $or: [{ buyer: req.user.sub }, { seller: req.user.sub }] 
    })
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      balance: user.walletBalance || 0,
      currency: 'XOF',
      transactions
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
