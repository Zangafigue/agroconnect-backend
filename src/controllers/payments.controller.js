const PaymentsService = require('../services/payments.service');
const Payment = require('../models/Payment');

exports.initiateOrderPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const payment = await PaymentsService.initiatePayment(orderId, req.user.sub, paymentMethod);
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ buyer: req.user.sub })
      .populate('order')
      .sort('-createdAt');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('order');
    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
