const Order = require('../models/Order');
const User = require('../models/User');

exports.getStats = async (req, res) => {
  try {
    const buyerId = req.user.sub;
    
    const [activeOrdersCount, totalSpentResult, favoritesCount] = await Promise.all([
      Order.countDocuments({ buyer: buyerId, status: { $in: ['PENDING', 'CONFIRMED', 'SHIPPED'] } }),
      Order.aggregate([
        { $match: { buyer: buyerId, status: 'COMPLETED' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // User might have a favorites array or we count products they liked (if implemented)
      User.findById(buyerId).then(user => user.favorites?.length || 0)
    ]);

    // Unread messages could come from a Message model
    const Message = require('../models/Message');
    const unreadMessages = await Message.countDocuments({ recipient: buyerId, isRead: false }).catch(() => 0);

    res.json({
      activeOrdersCount,
      favoritesCount,
      unreadMessages,
      totalSpent: totalSpentResult[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({ 
      buyer: req.user.sub, 
      status: { $in: ['PENDING', 'CONFIRMED', 'SHIPPED'] } 
    })
    .populate('seller', 'firstName lastName')
    .populate('product', 'name name_fr')
    .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
