const Order = require('../models/Order');
const DeliveryOffer = require('../models/DeliveryOffer');
const User = require('../models/User');
const PaymentsService = require('../services/payments.service');

// GET /deliveries/available — missions disponibles pour le transporteur
exports.getAvailableMissions = async (req, res) => {
  try {
    const orders = await Order.find({
      status: 'CONFIRMED',
      transporterAssigned: false,
      pickupAddress: { $exists: true }
    })
    .populate('buyer seller product', 'firstName lastName city name category images')
    .sort({ createdAt: -1 });

    const ordersWithOfferStatus = await Promise.all(orders.map(async (order) => {
      const myOffer = await DeliveryOffer.findOne({
        order: order._id,
        transporter: req.user.sub,
        status: 'PENDING'
      });
      const totalOffers = await DeliveryOffer.countDocuments({ order: order._id });
      return { ...order.toObject(), myOffer: myOffer || null, totalOffers };
    }));

    res.json(ordersWithOfferStatus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /deliveries/:orderId/offer
exports.submitOffer = async (req, res) => {
  try {
    const { proposedFee, message } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order || order.status !== 'CONFIRMED' || order.transporterAssigned)
      return res.status(400).json({ message: 'Mission non disponible' });

    const existing = await DeliveryOffer.findOne({
      order: order._id, transporter: req.user.sub, status: 'PENDING'
    });
    if (existing) return res.status(400).json({ message: 'Vous avez déjà soumis une offre' });

    const offer = await DeliveryOffer.create({
      order: order._id,
      transporter: req.user.sub,
      proposedFee,
      message
    });
    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /deliveries/orders/:orderId/offers — l'ACHETEUR voit les offres
exports.getOrderOffers = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    if (order.buyer.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });

    const offers = await DeliveryOffer.find({ order: order._id })
      .populate('transporter', 'firstName lastName city averageRating vehicleType phone')
      .sort({ proposedFee: 1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /deliveries/offers/:offerId/accept — l'ACHETEUR choisit un transporteur
exports.acceptOffer = async (req, res) => {
  try {
    const offer = await DeliveryOffer.findById(req.params.offerId).populate('order');
    if (!offer) return res.status(404).json({ message: 'Offre non trouvée' });

    if (offer.order.buyer.toString() !== req.user.sub)
      return res.status(403).json({ message: 'Non autorisé' });

    offer.status = 'ACCEPTED';
    await offer.save();

    await DeliveryOffer.updateMany(
      { order: offer.order._id, _id: { $ne: offer._id } },
      { status: 'REJECTED' }
    );

    await Order.findByIdAndUpdate(offer.order._id, {
      transporter: offer.transporter,
      transporterAssigned: true,
      deliveryFee: offer.proposedFee,
    });

    // Optionnel: Initier le paiement escrow à ce stade si on suppose le paiement en ligne direct.
    // await PaymentsService.initiatePayment(offer.order._id, req.user.sub, 'CINETPAY');

    res.json({ message: 'Transporteur assigné avec succès', offer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /deliveries/offers/:offerId/reject — l'ACHETEUR rejette un transporteur
exports.rejectOffer = async (req, res) => {
  try {
    const offer = await DeliveryOffer.findById(req.params.offerId).populate('order');
    if (!offer || offer.order.buyer.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });
    offer.status = 'REJECTED';
    await offer.save();
    res.json(offer);
  } catch (err) {
     res.status(500).json({ message: err.message });
  }
}

// DELETE /deliveries/offers/:offerId — le TRANSPORTEUR annule son offre
exports.withdrawOffer = async (req, res) => {
  try {
    const offer = await DeliveryOffer.findById(req.params.offerId);
    if (!offer || offer.transporter.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });
    if (offer.status !== 'PENDING') return res.status(400).json({ message: 'Impossible d\'annuler' });
    await offer.deleteOne();
    res.json({ message: 'Offre annulée' });
  } catch (err) {
     res.status(500).json({ message: err.message });
  }
}

// GET /deliveries/offers/mine — offres du TRANSPORTEUR
exports.getMyOffers = async (req, res) => {
  try {
     const offers = await DeliveryOffer.find({ transporter: req.user.sub }).populate({
       path: 'order',
       populate: { path: 'product buyer seller' }
     }).sort({ createdAt: -1 });
     res.json(offers);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// GET /deliveries/mine — livraisons assignées au TRANSPORTEUR
exports.getMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.find({ transporter: req.user.sub }).populate('buyer seller product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// PATCH /deliveries/:orderId/status — TRANSPORTER met à jour le statut
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'IN_TRANSIT' ou 'DELIVERED'
    const order = await Order.findById(req.params.orderId);

    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    if (order.transporter?.toString() !== req.user.sub)
      return res.status(403).json({ message: 'Vous n\'êtes pas le transporteur assigné' });

    const validTransitions = {
      'CONFIRMED': 'IN_TRANSIT',
      'IN_TRANSIT': 'DELIVERED',
      'PENDING': 'IN_TRANSIT' // workaround in case missing confirmation
    };
    if (validTransitions[order.status] !== status && order.status !== status)
      return res.status(400).json({ message: 'Transition de statut invalide' });

    order.status = status;
    await order.save();

    // Si livraison confirmée, libérer les fonds
    if (status === 'DELIVERED') {
      try {
         await PaymentsService.releaseFunds(order._id.toString());
      } catch (e) {
         console.error("Erreur libération de fonds au moment de DELIVERED:", e);
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
