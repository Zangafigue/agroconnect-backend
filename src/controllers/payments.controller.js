const PaymentsService = require('../services/payments.service');
const Payment = require('../models/Payment');
const User = require('../models/User');

// POST /api/payments/initiate/:orderId
exports.initiatePayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const payment = await PaymentsService.initiatePayment(req.params.orderId, req.user.sub, paymentMethod || 'CINETPAY');
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payments/confirm/:paymentId
exports.confirmPayment = async (req, res) => {
  try {
    // Dans une intégration réelle, cela viendrait d'un webhook CinetPay
    const payment = await Payment.findByIdAndUpdate(req.params.paymentId, { status: 'HELD' }, { new: true });
    res.json({ message: 'Paiement confirmé et séquestré', payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/order/:orderId
exports.getPaymentByOrder = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId });
    if (!payment) return res.status(404).json({ message: 'Aucun paiement pour cette commande' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/wallet
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('walletBalance walletPending totalEarned');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/payments/withdraw
exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const user = await User.findById(req.user.sub);
    if (user.walletBalance < amount) return res.status(400).json({ message: 'Solde insuffisant' });

    // RÈGLE : Simulation de demande de retrait
    user.walletBalance -= amount;
    await user.save();

    res.json({ message: 'Demande de retrait transmise à l\'administration', amount, method });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payments/history
exports.getHistory = async (req, res) => {
  try {
    const payments = await Payment.find({
      $or: [{ buyer: req.user.sub }, { 'splits.recipientId': req.user.sub }]
    }).populate('order').sort('-createdAt');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
