const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { createNotification } = require('./notification.controller');

async function notifyParticipants(conversation, senderId, messageContent) {
  const recipients = conversation.participants.filter(
    (p) => p.toString() !== senderId.toString()
  );
  const short = messageContent.length > 60 ? messageContent.substring(0, 60) + '...' : messageContent;
  await Promise.all(
    recipients.map((recipientId) =>
      createNotification(
        recipientId,
        'MESSAGE',
        'Nouveau message',
        short,
        conversation._id.toString()
      )
    )
  );
}

// Obtenir toutes les conversations de l'utilisateur
exports.getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ 
      participants: req.user.sub,
      deletedBy: { $ne: req.user.sub }
    })
      .populate('participants', 'firstName lastName profilePicture role')
      .populate('lastMessage')
      .sort('-updatedAt');
    
    // S'assurer que chaque conversation a un type et dédupliquer par interlocuteur
    const uniqueConversations = new Map();

    for (let c of conversations) {
      const conv = c.toObject();
      const other = conv.participants.find(p => p._id.toString() !== req.user.sub.toString());
      const otherId = other?._id.toString() || 'unknown';

      // On ne garde que la plus récente pour chaque interlocuteur (triées par updatedAt déjà)
      if (!uniqueConversations.has(otherId)) {
        if (!conv.type) {
          conv.type = (other?.role === 'TRANSPORTER' || req.user.role === 'TRANSPORTER') ? 'TRANSPORT' : 'NEGOTIATION';
        }
        // Compter les messages non-lus dans cette conversation pour cet utilisateur
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user.sub },
          read: false
        });
        conv.unreadCount = unreadCount;
        uniqueConversations.set(otherId, conv);
      }
    }

    res.json(Array.from(uniqueConversations.values()));
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

    const messages = await Message.find({ 
      conversation: conversationId,
      deletedBy: { $ne: req.user.sub }
    })
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
    
    // Chercher UNE SEULE conversation existante entre ces deux
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.sub, recipientId] }
    });

    if (conversation) {
      // Mettre à jour le contexte (optionnel, mais utile)
      if (productId) conversation.product = productId;
      if (orderId) conversation.order = orderId;
      // Retirer du deletedBy si nécessaire (s'il l'avait "supprimée" mais l'autre lui parle)
      conversation.deletedBy = conversation.deletedBy.filter(id => id.toString() !== req.user.sub.toString());
      conversation.deletedBy = conversation.deletedBy.filter(id => id.toString() !== recipientId.toString());
      await conversation.save();
      return res.status(200).json(conversation);
    }

    if (!conversation) {
      // Déterminer le type par défaut en fonction du destinataire
      const recipient = await User.findById(recipientId);
      const isTransport = recipient?.role === 'TRANSPORTER' || req.user.role === 'TRANSPORTER';
      
      conversation = await Conversation.create({
        participants: [req.user.sub, recipientId],
        product: productId,
        order: orderId,
        type: isTransport ? 'TRANSPORT' : 'NEGOTIATION'
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

// Marquer tous les messages d'une conversation comme lus
exports.markAsRead = async (req, res) => {
  try {
    const conversationId = req.params.id;
    // On marque comme lus les messages dont l'utilisateur n'est pas l'expéditeur
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user.sub }, read: false },
      { read: true }
    );

    // Marquer également les notifications liées comme lues
    const Notification = require('../models/Notification');
    await Notification.updateMany(
      { recipient: req.user.sub, relatedId: conversationId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Conversation marquée comme lue' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer (cacher) une conversation
exports.deleteConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { deletedBy: req.user.sub }
    });
    res.json({ message: 'Conversation supprimée pour cet utilisateur' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Supprimer (cacher) des messages en vrac
exports.deleteMessages = async (req, res) => {
  try {
    const { messageIds } = req.body;
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { deletedBy: req.user.sub } }
    );
    res.json({ message: `${messageIds.length} messages supprimés` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
