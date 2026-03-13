const Payment = require('../models/Payment');
const Order   = require('../models/Order');
const User    = require('../models/User');

// Initier un paiement escrow
exports.initiatePayment = async (orderId, buyerId, paymentMethod) => {
  const order = await Order.findById(orderId).populate('seller transporter');

  if (!order) throw new Error('Commande non trouvée');
  if (!order.transporterAssigned) throw new Error('Aucun transporteur assigné');

  const commissionRate = parseFloat(process.env.COMMISSION_RATE || '0.03');
  const productAmount  = order.totalPrice;
  const commissionAmount = Math.round(productAmount * commissionRate);
  const deliveryAmount = order.deliveryFee || 0;
  const totalAmount    = productAmount + deliveryAmount;

  const payment = await Payment.create({
    order: orderId,
    buyer: buyerId,
    productAmount,
    commissionRate,
    commissionAmount,
    deliveryAmount,
    totalAmount,
    status: 'HELD', // En mode test, on simule que le paiement est directement bloqué (séquestre)
    paymentMethod,
  });

  // Bloquer les fonds virtuellement en attente de livraison
  await User.findByIdAndUpdate(order.seller._id, {
    $inc: { walletPending: productAmount - commissionAmount }
  });
  if (order.transporter) {
    await User.findByIdAndUpdate(order.transporter._id, {
      $inc: { walletPending: deliveryAmount }
    });
  }

  return payment;
};

// Libérer les fonds automatiquement à DELIVERED
exports.releaseFunds = async (orderId) => {
  const payment = await Payment.findOne({ order: orderId });
  if (!payment || payment.status !== 'HELD') return;

  const order = await Order.findById(orderId).populate('seller transporter');
  const commissionRate   = payment.commissionRate;
  const commissionAmount = Math.round(payment.productAmount * commissionRate);
  const farmerAmount     = payment.productAmount - commissionAmount;
  const transporterAmount= payment.deliveryAmount;

  // Créditer wallet Farmer
  await User.findByIdAndUpdate(order.seller._id, {
    $inc: { walletBalance: farmerAmount, walletPending: -farmerAmount, totalEarned: farmerAmount }
  });

  // Créditer wallet Transporteur
  if (order.transporter) {
    await User.findByIdAndUpdate(order.transporter._id, {
      $inc: { walletBalance: transporterAmount, walletPending: -transporterAmount, totalEarned: transporterAmount }
    });
  }

  // Mettre à jour le paiement
  payment.status = 'FULLY_RELEASED';
  payment.splits = [
    { recipient: 'farmer',      recipientId: order.seller._id,     amount: farmerAmount,      type: 'product',    released: true },
    { recipient: 'transporter', recipientId: order.transporter?._id, amount: transporterAmount, type: 'delivery',   released: true },
    { recipient: 'platform',    amount: commissionAmount, type: 'commission', released: true },
  ];
  await payment.save();
};

// Geler les fonds (litige)
exports.freezeFunds = async (orderId) => {
  await Payment.findOneAndUpdate({ order: orderId }, { status: 'HELD' });
};
