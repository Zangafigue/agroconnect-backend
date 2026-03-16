const Order   = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// Helper pour créer une notification de statut de commande
async function notifyOrderStatus(recipientId, title, message, orderId) {
  try {
    await Notification.create({
      recipient: recipientId,
      type: 'ORDER_STATUS',
      title,
      message,
      relatedId: orderId?.toString(),
    });
  } catch (_) { /* ne pas bloquer si la notif échoue */ }
}

exports.createOrder = async (req, res) => {
  try {
    const { productId, quantity, deliveryAddress, deliveryCity, deliveryLat, deliveryLng, deliveryBudget, buyerNote } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    if (!product.available) return res.status(400).json({ message: 'Produit non disponible' });
    if (product.seller.toString() === req.user.sub) return res.status(400).json({ message: 'Vous ne pouvez pas commander votre propre produit' });
    if (product.quantity < quantity) return res.status(400).json({ message: `Stock insuffisant. Disponible : ${product.quantity} ${product.unit}` });
    const totalPrice = product.price * quantity;
    const order = await Order.create({ buyer: req.user.sub, seller: product.seller, product: productId, quantity, unitPrice: product.price, totalPrice, deliveryAddress, deliveryCity, deliveryLat, deliveryLng, deliveryBudget, buyerNote });
    res.status(201).json(order);
    // Notifier le vendeur d'une nouvelle commande
    notifyOrderStatus(product.seller, 'Nouvelle commande reçue', `Une commande de ${quantity} ${product.unit} de ${product.name} attend votre confirmation.`, order._id);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyOrdersBuyer = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.sub }).populate('seller product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyOrdersSeller = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user.sub }).populate('buyer product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOrders = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role === 'BUYER' || role === 'ACHETEUR') {
      query = { buyer: req.user.sub };
    } else if (role === 'FARMER' || role === 'AGRICULTEUR') {
      query = { seller: req.user.sub };
    } else if (role === 'TRANSPORTER' || role === 'TRANSPORTEUR') {
        query = { transporter: req.user.sub };
    } else {
      // Default: check both roles
      query = { $or: [{ buyer: req.user.sub }, { seller: req.user.sub }, { transporter: req.user.sub }] };
    }
    const orders = await Order.find(query).populate('buyer seller product transporter').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('buyer seller product transporter');
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    const isOwner = [order.buyer._id.toString(), order.seller._id.toString(), order.transporter?._id?.toString()].includes(req.user.sub);
    if (!isOwner) return res.status(403).json({ message: 'Non autorisé' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.confirmOrder = async (req, res) => {
  try {
    const { pickupAddress, pickupCity, pickupLat, pickupLng, availableFrom, transporterInstructions } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    if (order.seller.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });
    if (order.status !== 'PENDING') return res.status(400).json({ message: 'Commande déjà traitée' });
    if (!pickupAddress || !pickupCity) return res.status(400).json({ message: 'Adresse de collecte obligatoire' });
    const updated = await Order.findByIdAndUpdate(order._id, { status: 'CONFIRMED', pickupAddress, pickupCity, pickupLat, pickupLng, availableFrom: availableFrom || new Date(), transporterInstructions }, { new: true });
    res.json(updated);
    // Notifier l'acheteur que la commande est confirmée
    notifyOrderStatus(order.buyer, 'Commande confirmée !', 'Votre commande a été confirmée par l\'agriculteur. La livraison sera bientôt organisée.', order._id);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    const isOwner = [order.buyer.toString(), order.seller.toString()].includes(req.user.sub);
    if (!isOwner) return res.status(403).json({ message: 'Non autorisé' });
    if (!['PENDING','CONFIRMED'].includes(order.status)) return res.status(400).json({ message: 'Impossible d\'annuler à ce stade' });
    const updated = await Order.findByIdAndUpdate(order._id, { status: 'CANCELLED', refusalReason: req.body.reason }, { new: true });
    res.json(updated);
    // Notifier les deux parties de l'annulation
    const cancelMsg = 'La commande a été annulée.';
    const otherId = order.buyer.toString() === req.user.sub ? order.seller : order.buyer;
    notifyOrderStatus(otherId, 'Commande annulée', cancelMsg, order._id);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateTransporterPosition = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order || order.transporter?.toString() !== req.user.sub) return res.status(403).json({ message: 'Non autorisé' });
    const updated = await Order.findByIdAndUpdate(order._id, { transporterLat: lat, transporterLng: lng, transporterPositionUpdatedAt: new Date() }, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    
    // Auth simple : doit être l'un des participants
    const isParticipant = [order.buyer.toString(), order.seller.toString(), order.transporter?.toString()].includes(req.user.sub);
    if (!isParticipant) return res.status(403).json({ message: 'Non autorisé' });
    
    const updated = await Order.findByIdAndUpdate(order._id, { status }, { new: true });
    res.json(updated);
    // Notifier toutes les parties du changement de statut
    const statusMsg = `Le statut de votre commande est maintenant : ${status}.`;
    const recipients = [order.buyer, order.seller, order.transporter].filter(Boolean);
    recipients.forEach((r) => {
      if (r.toString() !== req.user.sub) {
        notifyOrderStatus(r, 'Statut de commande mis à jour', statusMsg, order._id);
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
