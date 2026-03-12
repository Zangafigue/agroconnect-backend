const Dispute = require('../models/Dispute');
const Order   = require('../models/Order');
const Payment = require('../models/Payment');

exports.createDispute = async (req, res) => {
  try {
    const { orderId, reason, description } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    const isInvolved = [order.buyer.toString(), order.seller.toString(), order.transporter?.toString()].includes(req.user.sub);
    if (!isInvolved) return res.status(403).json({ message: 'Non autorisé' });
    await Order.findByIdAndUpdate(orderId, { status: 'DISPUTED' });
    await Payment.findOneAndUpdate({ order: orderId }, { status: 'HELD' });
    let defendant = req.user.sub === order.buyer.toString() ? order.seller : order.buyer;
    const dispute = await Dispute.create({ order: orderId, claimant: req.user.sub, defendant, reason, description });
    res.status(201).json(dispute);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ $or: [{ claimant: req.user.sub }, { defendant: req.user.sub }] })
      .populate('order claimant defendant').sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id).populate('order claimant defendant');
    if (!dispute) return res.status(404).json({ message: 'Litige non trouvé' });
    const isOwner = [dispute.claimant._id.toString(), dispute.defendant._id.toString()].includes(req.user.sub);
    if (!isOwner) return res.status(403).json({ message: 'Non autorisé' });
    res.json(dispute);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
