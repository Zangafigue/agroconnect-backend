const mongoose = require('mongoose');

const deliveryOfferSchema = new mongoose.Schema({
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  transporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  proposedFee: { type: Number, required: true },
  message:     { type: String, maxlength: 200 },
  status:      { type: String, enum: ['PENDING','ACCEPTED','REJECTED'], default: 'PENDING' },
}, { timestamps: true });

// Index pour chercher les offres d'une commande
deliveryOfferSchema.index({ order: 1, status: 1 });

module.exports = mongoose.model('DeliveryOffer', deliveryOfferSchema);
