const Payment = require('../models/Payment');
const Order   = require('../models/Order');
const User    = require('../models/User');

exports.initiatePayment = async (orderId, buyerId, paymentMethod) => {
  const order = await Order.findById(orderId).populate('seller transporter');
  if (!order) throw new Error('Commande non trouvée');
  if (!order.transporterAssigned) throw new Error('Aucun transporteur assigné');

  const commissionRate   = parseFloat(process.env.COMMISSION_RATE || '0.03');
  const productAmount    = order.totalPrice;
  const commissionAmount = Math.round(productAmount * commissionRate);
  const deliveryAmount   = order.deliveryFee || 0;
  const totalAmount      = productAmount + deliveryAmount;

  const payment = await Payment.create({
    order: orderId, buyer: buyerId,
    productAmount, commissionRate, commissionAmount, deliveryAmount, totalAmount,
    status: 'HELD', paymentMethod,
  });

  await User.findByIdAndUpdate(order.seller._id, { $inc: { walletPending: productAmount - commissionAmount } });
  if (order.transporter) {
    await User.findByIdAndUpdate(order.transporter._id, { $inc: { walletPending: deliveryAmount } });
  }
  return payment;
};

exports.releaseFunds = async (orderId) => {
  const payment = await Payment.findOne({ order: orderId });
  if (!payment || payment.status !== 'HELD') return;

  const order = await Order.findById(orderId).populate('seller transporter');
  const farmerAmount      = payment.productAmount - Math.round(payment.productAmount * payment.commissionRate);
  const transporterAmount = payment.deliveryAmount;

  await User.findByIdAndUpdate(order.seller._id, {
    $inc: { walletBalance: farmerAmount, walletPending: -farmerAmount, totalEarned: farmerAmount }
  });
  if (order.transporter) {
    await User.findByIdAndUpdate(order.transporter._id, {
      $inc: { walletBalance: transporterAmount, walletPending: -transporterAmount, totalEarned: transporterAmount }
    });
  }

  payment.status = 'FULLY_RELEASED';
  payment.splits = [
    { recipient: 'farmer',      recipientId: order.seller._id,      amount: farmerAmount,      type: 'product',    released: true },
    { recipient: 'transporter', recipientId: order.transporter?._id, amount: transporterAmount, type: 'delivery',   released: true },
    { recipient: 'platform',    amount: Math.round(payment.productAmount * payment.commissionRate), type: 'commission', released: true },
  ];
  await payment.save();
};

exports.freezeFunds = async (orderId) => {
  await Payment.findOneAndUpdate({ order: orderId }, { status: 'HELD' });
};
