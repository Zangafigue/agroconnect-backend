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
      const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user.sub },
        { isRead: true },
        { new: true }
      );
      if (!notification) return res.status(404).json({ message: 'Notification introuvable' });
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
      await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.sub });
      res.json({ message: 'Notification supprimée' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteNotifications: async (req, res) => {
    try {
      const { ids } = req.body;
      await Notification.deleteMany({ _id: { $in: ids }, recipient: req.user.sub });
      res.json({ message: `${ids.length} notifications supprimées` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteAllNotifications: async (req, res) => {
    try {
      await Notification.deleteMany({ recipient: req.user.sub });
      res.json({ message: 'Toutes les notifications supprimées' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  createNotification: async (recipient, type, title, message, relatedId = null) => {
    try {
      // Éviter les doublons exacts créés en même temps (throttle de 2s)
      const existing = await Notification.findOne({
        recipient,
        type,
        title,
        message,
        relatedId,
        createdAt: { $gte: new Date(Date.now() - 2000) }
      });
      if (existing) return existing;

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
