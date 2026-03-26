const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Payment = require('../models/Payment');
const Dispute = require('../models/Dispute');
const PaymentService = require('../services/payment.service');

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, paymentStats, openDisputes, pendingWithdrawals] = await Promise.all([
      User.countDocuments({ role: { $ne: 'ADMIN' } }),
      Product.countDocuments({ available: true, hidden: false }),
      Order.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, totalVolume: { $sum: '$totalAmount' }, totalCommission: { $sum: '$commissionAmount' }, heldFunds: { $sum: { $cond: [{ $eq: ['$status','HELD'] }, '$totalAmount', 0] } } } }]),
      Dispute.countDocuments({ status: 'OPEN' }),
      Payment.countDocuments({ status: 'PENDING', type: 'WITHDRAWAL' })
    ]);
    const roleStats = await User.aggregate([{ $match: { role: { $ne: 'ADMIN' } } }, { $group: { _id: '$role', count: { $sum: 1 } } }]);
    res.json({ 
      totalUsers, 
      totalProducts, 
      totalOrders, 
      openDisputes, 
      pendingWithdrawals,
      totalVolume: paymentStats[0]?.totalVolume || 0, 
      totalCommission: paymentStats[0]?.totalCommission || 0, 
      heldFunds: paymentStats[0]?.heldFunds || 0, 
      roleStats 
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, city, specialty } = req.query;
    const query = { role: { $ne: 'ADMIN' } };
    if (role) query.role = role;
    if (status === 'suspended') query.isActive = false;
    if (status === 'active')    query.isActive = true;
    if (city)      query.city = new RegExp(city, 'i');
    if (specialty) query.specialty = new RegExp(specialty, 'i');
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([User.find(query).select('-passwordHash').skip(skip).limit(parseInt(limit)), User.countDocuments(query)]);
    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ message: `Compte ${isActive ? 'activé' : 'suspendu'}`, user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('seller', 'firstName lastName').sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.hideProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { hidden: true }, { new: true });
    res.json({ message: 'Produit masqué', product });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const available = status === 'active';
    const product = await Product.findByIdAndUpdate(req.params.id, { available, hidden: !available }, { new: true });
    res.json({ message: `Produit ${available ? 'activé' : 'désactivé'}`, product });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([Order.find(query).populate('buyer seller product').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)), Order.countDocuments(query)]);
    res.json({ orders, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('buyer seller product transporter');
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find().populate('order claimant defendant').sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { resolution, decision } = req.body;
    const dispute = await Dispute.findById(req.params.id).populate('order');
    if (!dispute) return res.status(404).json({ message: 'Litige non trouvé' });
    dispute.status = 'RESOLVED'; dispute.resolution = resolution; dispute.decision = decision;
    dispute.resolvedBy = req.user.sub; dispute.resolvedAt = new Date();
    await dispute.save();
    if (decision === 'VALIDATE_DELIVERY') await PaymentService.releaseFunds(dispute.order._id.toString());
    else if (decision === 'REFUND_BUYER') {
      const payment = await Payment.findOneAndUpdate({ order: dispute.order._id }, { status: 'REFUNDED' }, { new: true });
      if (payment) await User.findByIdAndUpdate(dispute.order.buyer, { $inc: { walletBalance: payment.totalAmount } });
    }
    res.json({ message: 'Litige résolu', dispute });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('order buyer').sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.releaseFunds = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });
    await PaymentService.releaseFunds(payment.order.toString());
    res.json({ message: 'Fonds libérés manuellement' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.validateWithdrawal = async (req, res) => {
  try {
    res.json({ message: 'Retrait validé (simulation)', id: req.params.id });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createUser = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { email, password, firstName, lastName, phone, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email, passwordHash, firstName, lastName, phone, role,
      isVerified: true, isActive: true
    });
    res.status(201).json({ message: 'Utilisateur créé avec succès', user: user.toJSON() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
