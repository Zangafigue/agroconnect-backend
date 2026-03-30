const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  deletedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: {
    type: String,
    enum: ['NEGOTIATION', 'TRANSPORT'],
    required: true,
    default: 'NEGOTIATION'
  }
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
