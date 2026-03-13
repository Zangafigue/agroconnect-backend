const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

module.exports = mongoose.model('Conversation', conversationSchema);
