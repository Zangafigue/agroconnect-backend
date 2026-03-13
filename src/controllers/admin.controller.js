const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Payment = require('../models/Payment');
const Dispute = require('../models/Dispute');
const PaymentsService = require('../services/payments.service');

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, paymentStats, openDisputes] =
      await Promise.all([
        User.countDocuments({ role: { $ne: 'ADMIN' } }),
        Product.countDocuments({ available: true }),
        Order.countDocuments(),
        Payment.aggregate([{ $group: {
          _id: null,
          totalVolume:     { $sum: '$totalAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          heldFunds:       { $sum: { $cond: [{ $eq: ['$status','HELD'] }, '$totalAmount', 0] } }
        }}]),
        Dispute.countDocuments({ status: 'OPEN' }),
      ]);

    const roleStats = await User.aggregate([
      { $match: { role: { $ne: 'ADMIN' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers, totalProducts, totalOrders, openDisputes,
      totalVolume:     paymentStats[0]?.totalVolume || 0,
      totalCommission: paymentStats[0]?.totalCommission || 0,
      heldFunds:       paymentStats[0]?.heldFunds || 0,
      roleStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, decision } = req.body;
    const dispute = await Dispute.findById(req.params.id).populate('order');
    if (!dispute) return res.status(404).json({ message: 'Litige non trouvé' });

    dispute.status     = 'RESOLVED';
    dispute.resolution = resolution;
    dispute.decision   = decision;
    dispute.resolvedBy = req.user.sub;
    dispute.resolvedAt = new Date();
    await dispute.save();

    // Appliquer la décision financière
    if (decision === 'VALIDATE_DELIVERY') {
      await PaymentsService.releaseFunds(dispute.order._id.toString());
    } else if (decision === 'REFUND_BUYER') {
      await Payment.findOneAndUpdate(
        { order: dispute.order._id },
        { status: 'REFUNDED' }
      );
      // Créditer le wallet de l'acheteur
      const payment = await Payment.findOne({ order: dispute.order._id });
      if (payment) {
          await User.findByIdAndUpdate(dispute.order.buyer, {
             $inc: { walletBalance: payment.totalAmount }
          });
      }
    }

    res.json({ message: 'Litige résolu', dispute });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ... autres méthodes (getUsers, getProducts, etc.) simplifiées pour le MVP
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'ADMIN' } }).select('-passwordHash');
        res.json(users);
    } catch (err) { res.status(500).json({ message: err.message }); }
}
