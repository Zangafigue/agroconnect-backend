const Notification = require('../models/Notification');

// Obtenir toutes les notifications de l'utilisateur
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.sub })
      .sort('-createdAt')
      .limit(100);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.sub },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification non trouvée' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.sub, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Fonction utilitaire pour créer une notification (utilisée par d'autres contrôleurs)
exports.createNotification = async (recipient, type, title, message, relatedId = null) => {
  try {
    await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedId
    });
  } catch (err) {
    console.error('Erreur lors de la création de la notification:', err);
  }
};
