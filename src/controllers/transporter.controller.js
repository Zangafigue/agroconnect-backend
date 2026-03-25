const Order = require('../models/Order');
const DeliveryOffer = require('../models/DeliveryOffer');

exports.getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Order.find({ 
      transporter: req.user.sub, 
      transporterAssigned: true 
    })
    .populate('buyer', 'firstName lastName phone')
    .populate('seller', 'firstName lastName phone')
    .populate('product', 'name name_fr')
    .sort({ updatedAt: -1 });
    
    res.json(deliveries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyOffers = async (req, res) => {
  try {
    const offers = await DeliveryOffer.find({ transporter: req.user.sub })
      .populate({
        path: 'order',
        populate: { path: 'product buyer seller' }
      })
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.submitOffer = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { proposedFee, message } = req.body;
    
    const offer = await DeliveryOffer.create({
      order: orderId,
      transporter: req.user.sub,
      proposedFee,
      message
    });
    
    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const delivery = await Order.findOneAndUpdate(
      { _id: req.params.id, transporter: req.user.sub },
      { status },
      { new: true }
    );
    if (!delivery) return res.status(404).json({ message: 'Livraison non trouvée' });
    res.json(delivery);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
