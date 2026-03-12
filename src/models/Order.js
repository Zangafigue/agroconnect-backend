const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  seller:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:   { type: Number, required: true },
  unitPrice:  { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING','CONFIRMED','IN_TRANSIT','DELIVERED','CANCELLED','DISPUTED'],
    default: 'PENDING'
  },
  // Renseigné par le Farmer à la confirmation
  pickupAddress:           { type: String },
  pickupCity:              { type: String },
  pickupLat:               { type: Number },
  pickupLng:               { type: Number },
  availableFrom:           { type: Date   },
  transporterInstructions: { type: String },
  // Renseigné par le Buyer à la commande
  deliveryAddress: { type: String, required: true },
  deliveryCity:    { type: String, required: true },
  deliveryLat:     { type: Number },
  deliveryLng:     { type: Number },
  deliveryBudget:  { type: Number },
  buyerNote:       { type: String },
  // Assigné après sélection du transporteur
  transporter:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transporterAssigned: { type: Boolean, default: false },
  deliveryFee:         { type: Number },
  transporterLat:      { type: Number },
  transporterLng:      { type: Number },
  transporterPositionUpdatedAt: { type: Date },
  // Motif de refus
  refusalReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
