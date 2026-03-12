const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:      { type: String, required: true },
  type: {
    type: String,
    enum: ['text','price_offer','price_accepted','price_rejected'],
    default: 'text'
  },
  offerAmount: { type: Number },
  read:        { type: Boolean, default: false },
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);
const Message      = mongoose.model('Message', messageSchema);

module.exports = { Conversation, Message };
