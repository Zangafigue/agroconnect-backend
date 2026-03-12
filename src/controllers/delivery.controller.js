const Order         = require('../models/Order');
const DeliveryOffer = require('../models/DeliveryOffer');

exports.getAvailableMissions = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'CONFIRMED', transporterAssigned: false, pickupAddress: { $exists: true } })
      .populate('buyer seller product', 'firstName lastName city name category images')
      .sort({ createdAt: -1 });
    const result = await Promise.all(orders.map(async (order) => {
      const myOffer    = await DeliveryOffer.findOne({ order: order._id, transporter: req.user.sub, status: 'PENDING' });
      const totalOffers= await DeliveryOffer.countDocuments({ order: order._id });
      return { ...order.toObject(), myOffer: myOffer || null, totalOffers };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.submitOffer = async (req, res) => {
  try {
    const { proposedFee, message } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order || order.status !== 'CONFIRMED' || order.transporterAssigned) return res.status(400).json({ message: 'Mission non disponible' });
    const existing = await DeliveryOffer.findOne({ order: order._id, transporter: req.user.sub, status: 'PENDING' });
    if (existing) return res.status(400).json({ message: 'Vous avez déjà soumis une offre' });
    const offer = await DeliveryOffer.create({ order: order._id, transporter: req.user.sub, proposedFee, message });
    res.status(201).json(offer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.withdrawOffer = async (req, res) => {
  try {
    const offer = await DeliveryOffer.findById(req.params.offerId);
    if (!offer || offer.transporter.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });
    if (offer.status !== 'PENDING') return res.status(400).json({ message: 'Impossible de retirer cette offre' });
    await offer.deleteOne();
    res.json({ message: 'Offre retirée' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyOffers = async (req, res) => {
  try {
    const offers = await DeliveryOffer.find({ transporter: req.user.sub }).populate('order').sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.find({ transporter: req.user.sub, transporterAssigned: true }).populate('buyer seller product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    if (order.transporter?.toString() !== req.user.sub) return res.status(403).json({ message: 'Vous n\'êtes pas le transporteur assigné' });
    const validTransitions = { 'CONFIRMED': 'IN_TRANSIT', 'IN_TRANSIT': 'DELIVERED' };
    if (validTransitions[order.status] !== status) return res.status(400).json({ message: 'Transition de statut invalide' });
    order.status = status;
    await order.save();
    if (status === 'DELIVERED') {
      const PaymentsService = require('../services/payment.service');
      await PaymentsService.releaseFunds(order._id.toString());
    }
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOrderOffers = async (req, res) => {
  try {
    const offers = await DeliveryOffer.find({ order: req.params.orderId }).populate('transporter', 'firstName lastName averageRating totalRatings');
    res.json(offers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.acceptOffer = async (req, res) => {
  try {
    const offer = await DeliveryOffer.findById(req.params.offerId).populate('order');
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée' });
    if (offer.order.buyer.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });
    offer.status = 'ACCEPTED';
    await offer.save();
    await DeliveryOffer.updateMany({ order: offer.order._id, _id: { $ne: offer._id } }, { status: 'REJECTED' });
    await Order.findByIdAndUpdate(offer.order._id, { transporter: offer.transporter, transporterAssigned: true, deliveryFee: offer.proposedFee });
    res.json({ message: 'Transporteur assigné avec succès', offer });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.rejectOffer = async (req, res) => {
  try {
    const offer = await DeliveryOffer.findById(req.params.offerId).populate('order');
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée' });
    if (offer.order.buyer.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });
    offer.status = 'REJECTED';
    await offer.save();
    res.json({ message: 'Offre refusée', offer });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
