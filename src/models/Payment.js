const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order:           { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  buyer:           { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  productAmount:   { type: Number, required: true },
  commissionRate:  { type: Number, default: 0.03 },
  commissionAmount:{ type: Number, required: true },
  deliveryAmount:  { type: Number, required: true },
  totalAmount:     { type: Number, required: true },
  splits: [{
    recipient:   { type: String }, // 'farmer', 'transporter', 'platform'
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount:      { type: Number },
    type:        { type: String }, // 'product', 'delivery', 'commission'
    released:    { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['PENDING','HELD','FULLY_RELEASED','REFUNDED','FAILED'],
    default: 'PENDING'
  },
  paymentMethod:         { type: String },
  cinetpayTransactionId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
