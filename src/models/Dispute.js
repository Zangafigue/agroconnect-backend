const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  claimant:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  defendant:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  reason: {
    type: String,
    enum: ['NON_DELIVERED','DAMAGED','WRONG_QUANTITY','WRONG_PRODUCT','PAYMENT_ISSUE','OTHER']
  },
  description: { type: String, required: true },
  photos:      [{ type: String }],
  status:      { type: String, enum: ['OPEN','IN_REVIEW','RESOLVED'], default: 'OPEN' },
  resolution:  { type: String },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt:  { type: Date },
  decision: {
    type: String,
    enum: ['REFUND_BUYER','VALIDATE_DELIVERY','PARTIAL','NO_ACTION']
  },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
