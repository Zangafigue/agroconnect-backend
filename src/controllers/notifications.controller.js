const Notification = require('../models/Notification');

// Récupérer les notifications de l'utilisateur connecté
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.sub })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: err.message }); }
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
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Marquer toutes les notifications comme lues
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.sub, isRead: false }, { isRead: true });
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
