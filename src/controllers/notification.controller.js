const Notification = require('../models/Notification');

const notificationController = {
  getAdminNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ 
        $or: [
          { recipientRole: 'ADMIN' },
          { isGlobal: true }
        ]
      }).sort({ createdAt: -1 }).limit(50);
      
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getMyNotifications: async (req, res) => {
    try {
      const notifications = await Notification.find({ 
        recipient: req.user.sub 
      }).sort({ createdAt: -1 }).limit(50);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  markAllRead: async (req, res) => {
    try {
      await Notification.updateMany(
        { recipient: req.user.sub, isRead: false },
        { isRead: true }
      );
      res.json({ message: 'Toutes les notifications marquées comme lues' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteNotification: async (req, res) => {
    try {
      await Notification.findByIdAndDelete(req.params.id);
      res.json({ message: 'Notification supprimée' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Helper interne pour les autres contrôleurs
  createNotification: async (recipient, type, title, message, relatedId = null) => {
    try {
      return await Notification.create({
        recipient,
        type,
        title,
        message,
        relatedId
      });
    } catch (error) {
      console.error('Erreur createNotification:', error);
    }
  }
};

module.exports = notificationController;
