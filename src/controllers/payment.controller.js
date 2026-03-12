const Payment = require('../models/Payment');
const Order   = require('../models/Order');
const User    = require('../models/User');
const PaymentService = require('../services/payment.service');

exports.initiatePayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const payment = await PaymentService.initiatePayment(req.params.orderId, req.user.sub, paymentMethod);
    res.status(201).json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });
    if (payment.buyer.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });
    payment.status = 'HELD';
    await payment.save();
    res.json({ message: 'Paiement confirmé. Fonds sécurisés en escrow.', payment });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPaymentByOrder = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId });
    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });
    res.json(payment);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('walletBalance walletPending totalEarned');
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.requestWithdrawal = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const user = await User.findById(req.user.sub);
    if (user.walletBalance < amount) return res.status(400).json({ message: 'Solde insuffisant' });
    // Simulation: décrémenter le solde et marquer comme en attente
    await User.findByIdAndUpdate(req.user.sub, { $inc: { walletBalance: -amount, walletPending: amount } });
    res.json({ message: 'Demande de retrait soumise. Traitement sous 24-48h.', amount, method });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getHistory = async (req, res) => {
  try {
    const payments = await Payment.find({
      $or: [{ buyer: req.user.sub }]
    }).populate('order').sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
