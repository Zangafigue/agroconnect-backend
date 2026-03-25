const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getStats = async (req, res) => {
  try {
    const farmerId = req.user.sub;

    const [totalSalesResult, activeOrders, productsListed, pendingReviews] = await Promise.all([
      Order.aggregate([
        { $match: { seller: farmerId, status: 'DELIVERED' } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      Order.countDocuments({ seller: farmerId, status: { $in: ['PENDING', 'CONFIRMED', 'IN_TRANSIT'] } }),
      Product.countDocuments({ seller: farmerId }),
      // Reviews might be in a Review model, for now 0
      Promise.resolve(0)
    ]);

    // Calculate revenue growth (mocked for now or based on last 30 days)
    const revenueGrowth = 0; 

    res.json({
      totalSales: totalSalesResult[0]?.total || 0,
      activeOrders,
      productsListed,
      pendingReviews: pendingReviews || 0,
      revenueGrowth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { seller: req.user.sub };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName')
      .populate('product', 'name name_fr')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      seller: req.user.sub,
      status: { $in: ['PENDING', 'CONFIRMED', 'IN_TRANSIT'] }
    })
    .populate('buyer', 'firstName lastName')
    .populate('product', 'name name_fr')
    .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.sub },
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
