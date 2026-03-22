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

  markAsRead: async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { read: true },
        { new: true }
      );
      res.json(notification);
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
  }
};

module.exports = notificationController;
