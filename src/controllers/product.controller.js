const Product = require('../models/Product');

exports.getCatalog = async (req, res) => {
  try {
    const { category, city, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;
    const query = { available: true, hidden: false };
    if (category) query.category = category;
    if (city)     query.city = new RegExp(city, 'i');
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) query.$text = { $search: search };
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).populate('seller', 'firstName lastName city averageRating totalRatings').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'firstName lastName city averageRating totalRatings phone');
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, unit, quantity, category, city, address, lat, lng } = req.body;
    const images = req.files?.map(f => f.path) || req.body.images || [];
    const product = await Product.create({ seller: req.user.sub, name, description, price, unit, quantity, category, city, address, lat, lng, images });
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });

    // Comparaison robuste (ObjectId vs String)
    const sellerId = product.seller.toString();
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'ADMIN';

    if (sellerId !== userId && !isAdmin) {
      console.log(`403 Debug - Seller: ${sellerId}, User: ${userId}, Role: ${req.user.role}`);
      return res.status(403).json({ message: 'Non autorisé : vous n\'êtes pas le propriétaire' });
    }

    const { images: existingImages, ...updateData } = req.body;
    
    // Gérer les images : fusionner les anciennes conservées et les nouvelles
    let images = [];
    if (existingImages) {
      images = Array.isArray(existingImages) ? existingImages : [existingImages];
    }
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.path);
      images = [...images, ...newImages];
    }
    
    // Si on a des images (fichiers ou existantes), on met à jour
    if (images.length > 0) updateData.images = images;

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    if (product.seller.toString() !== req.user.sub && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    await product.deleteOne();
    res.json({ message: 'Produit supprimé' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.sub }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    if (product.seller.toString() !== req.user.sub && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Non autorisé' });
    }
    
    product.available = !product.available;
    await product.save();
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
