const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { createNotification } = require('./notification.controller');
const Notification = require('../models/Notification');

// Helper: crée une notification de message pour tous les participants sauf l'expéditeur
async function notifyParticipants(conversation, senderId, messageContent) {
  const recipients = conversation.participants.filter(
    (p) => p.toString() !== senderId.toString()
  );
  const short = messageContent.length > 60 ? messageContent.substring(0, 60) + '...' : messageContent;
  await Promise.all(
    recipients.map((recipientId) =>
      Notification.create({
        recipient: recipientId,
        type: 'MESSAGE',
        title: 'Nouveau message',
        message: short,
        relatedId: conversation._id.toString(),
      })
    )
  );
}

// Obtenir toutes les conversations de l'utilisateur
exports.getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.sub })
      .populate('participants', 'firstName lastName profilePicture')
      .populate('lastMessage')
      .sort('-updatedAt');
    res.json(conversations);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Obtenir les messages d'une conversation
exports.getMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const limit = parseInt(req.query.limit) || 50;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation?.participants.includes(req.user.sub))
      return res.status(403).json({ message: 'Non autorisé' });

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'firstName lastName profilePicture')
      .sort('-createdAt')
      .limit(limit);

    res.json(messages.reverse());
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Créer ou récupérer une conversation
exports.startConversation = async (req, res) => {
  try {
    const { recipientId, productId, orderId } = req.body;
    
    // Chercher une conversation existante entre ces deux
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.sub, recipientId] },
      ...(productId && { product: productId }),
      ...(orderId && { order: orderId })
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.sub, recipientId],
        product: productId,
        order: orderId
      });
    }

    res.status(201).json(conversation);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// Envoyer un message (texte court)
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation?.participants.includes(req.user.sub))
      return res.status(403).json({ message: 'Non autorisé' });

    const msg = await Message.create({
      conversation: conversationId,
      sender: req.user.sub,
      content,
      type: 'text'
    });

    await Conversation.findByIdAndUpdate(conversationId, { lastMessage: msg._id });
    // Notifier les autres participants
    await notifyParticipants(conversation, req.user.sub, content);
    res.status(201).json(msg);
  } catch (err) { res.status(500).json({ message: err.message }); }
}

// Envoyer une offre de prix
exports.sendPriceOffer = async (req, res) => {
  try {
    const { amount } = req.body;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation?.participants.includes(req.user.sub))
      return res.status(403).json({ message: 'Non participant à cette conversation' });

    const msg = await Message.create({
      conversation: conversation._id,
      sender: req.user.sub,
      content: `Offre de prix : ${amount.toLocaleString()} FCFA`,
      type: 'price_offer',
      offerAmount: amount,
    });
    await Conversation.findByIdAndUpdate(conversation._id, { lastMessage: msg._id });
    // Notifier les autres participants
    await notifyParticipants(conversation, req.user.sub, msg.content);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Répondre à une offre
exports.respondToOffer = async (req, res) => {
  try {
    const { accept } = req.body;
    const msg = await Message.findById(req.params.msgId).populate('conversation');
    if (msg.type !== 'price_offer') return res.status(400).json({ message: 'Pas une offre de prix' });

    const responseType = accept ? 'price_accepted' : 'price_rejected';

    if (accept && msg.conversation.order) {
      const Order = require('../models/Order');
      await Order.findByIdAndUpdate(msg.conversation.order, {
        unitPrice: msg.offerAmount,
        totalPrice: msg.offerAmount // simplifie: supposons qté=1 ou offre totale
      });
    }

    const response = await Message.create({
      conversation: msg.conversation._id,
      sender: req.user.sub,
      content: accept ? 'Offre acceptée' : 'Offre refusée',
      type: responseType,
    });
    
    await Conversation.findByIdAndUpdate(msg.conversation._id, { lastMessage: response._id });
    
    // Notification pour l'expéditeur de l'offre
    await createNotification(
      msg.sender,
      'MESSAGE',
      accept ? 'Offre acceptée' : 'Offre refusée',
      accept ? 'Votre offre de prix a été acceptée.' : 'Votre offre de prix a été refusée.',
      msg.conversation._id
    );

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
