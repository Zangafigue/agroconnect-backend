const Order   = require('../models/Order');
const Product = require('../models/Product');

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

    // RÈGLE : Déduire le stock dès la commande
    product.quantity -= quantity;
    await product.save();

    res.status(201).json(order);
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

    // RÈGLE : Rendre le stock si annulé
    const product = await Product.findById(order.product);
    if (product) {
       product.quantity += order.quantity;
       await product.save();
    }

    res.json(updated);
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
