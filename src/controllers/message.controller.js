const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const Order = require('../models/Order');

exports.getMyConversations = async (req, res) => {
  try {
    const convs = await Conversation.find({ participants: req.user.sub })
      .populate('participants', 'firstName lastName profilePicture')
      .populate('lastMessage')
      .populate('product', 'name images')
      .sort({ updatedAt: -1 });
    res.json(convs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createOrGetConversation = async (req, res) => {
  try {
    const { participantId, productId, orderId } = req.body;
    let conv = await Conversation.findOne({ participants: { $all: [req.user.sub, participantId] }, product: productId || undefined });
    if (!conv) {
      conv = await Conversation.create({ participants: [req.user.sub, participantId], product: productId, order: orderId });
    }
    res.json(conv);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMessages = async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv?.participants.map(p => p.toString()).includes(req.user.sub)) return res.status(403).json({ message: 'Non participant' });
    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'firstName lastName profilePicture')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const conv = await Conversation.findById(req.params.id);
    if (!conv?.participants.map(p => p.toString()).includes(req.user.sub)) return res.status(403).json({ message: 'Non participant' });
    const msg = await Message.create({ conversation: req.params.id, sender: req.user.sub, content, type: 'text' });
    await Conversation.findByIdAndUpdate(req.params.id, { lastMessage: msg._id });
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.sendPriceOffer = async (req, res) => {
  try {
    const { amount } = req.body;
    const conv = await Conversation.findById(req.params.id);
    if (!conv?.participants.map(p => p.toString()).includes(req.user.sub)) return res.status(403).json({ message: 'Non participant' });
    const msg = await Message.create({
      conversation: conv._id, sender: req.user.sub,
      content: `💰 Offre de prix : ${amount.toLocaleString()} FCFA`,
      type: 'price_offer', offerAmount: amount,
    });
    await Conversation.findByIdAndUpdate(conv._id, { lastMessage: msg._id });
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.respondToOffer = async (req, res) => {
  try {
    const { accept } = req.body;
    const msg = await Message.findById(req.params.msgId).populate('conversation');
    if (msg.type !== 'price_offer') return res.status(400).json({ message: 'Pas une offre de prix' });
    const responseType = accept ? 'price_accepted' : 'price_rejected';
    if (accept && msg.conversation.order) {
      await Order.findByIdAndUpdate(msg.conversation.order, { unitPrice: msg.offerAmount });
    }
    const response = await Message.create({
      conversation: msg.conversation._id, sender: req.user.sub,
      content: accept ? '✅ Offre acceptée' : '❌ Offre refusée', type: responseType,
    });
    res.json(response);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.markAsRead = async (req, res) => {
  try {
    await Message.updateMany({ conversation: req.params.id, sender: { $ne: req.user.sub }, read: false }, { read: true });
    res.json({ message: 'Messages marqués comme lus' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
