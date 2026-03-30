const Product = require('../models/Product');
const { createNotification } = require('./notification.controller');
const User = require('../models/User');

exports.getCatalog = async (req, res) => {
  try {
    const { category, city, location, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;
    const query = { available: true, hidden: false };
    if (category) query.category = category;
    if (city)     query.city = new RegExp(city, 'i');
    if (location) query.location = new RegExp(location, 'i');
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) query.$text = { $search: search };
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query).populate('seller', 'firstName lastName city profilePicture averageRating totalRatings').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);
    res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'firstName lastName city profilePicture averageRating totalRatings phone');
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createProduct = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, description, price, unit, quantity, category, city, address, location, lat, lng } = body;
    const images = req.files?.map(f => f.path) || body.images || [];
    
    if (!name || !price) {
      return res.status(400).json({ message: 'Nom et prix sont requis' });
    }

    const product = await Product.create({ seller: req.user.sub, name, description, price, unit, quantity, category, city, address, location, lat, lng, images });
    res.status(201).json(product);

    // Notification broadcast aux ACHETEURS
    const buyers = await User.find({ role: 'BUYER', isActive: true });
    for (const b of buyers) {
       createNotification(
         b._id,
         'ORDER_STATUS', // Ou un nouveau type 'CATALOGUE'
         'Nouveau produit disponible',
         `${req.user.firstName} a ajouté un nouveau produit : ${product.name} (${product.city})`,
         product._id
       );
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateProduct = async (req, res) => {
  console.log(`[DEBUG] UpdateProduct hit for ID: ${req.params.id}`);
  console.log(`[DEBUG] Headers Content-Type: ${req.headers['content-type']}`);
  console.log(`[DEBUG] Files received: ${req.files?.length || 0}`);
  
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log(`[DEBUG] Product ${req.params.id} not found`);
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Sécurité req.user
    if (!req.user || !req.user.sub) {
      console.log(`[DEBUG] User missing sub field: ${JSON.stringify(req.user)}`);
      return res.status(401).json({ message: 'Session invalide' });
    }

    // Comparaison robuste (ObjectId vs String)
    const sellerId = product.seller ? product.seller.toString() : 'missing';
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'ADMIN';

    if (sellerId !== userId && !isAdmin) {
      console.log(`403 Debug - Seller: ${sellerId}, User: ${userId}, Role: ${req.user.role}`);
      return res.status(403).json({ message: 'Non autorisé : vous n\'êtes pas le propriétaire' });
    }

    // Destructuration sécurisée
    const body = req.body || {};
    const { images: existingImages, ...updateData } = body;
    
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

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    
    if (product.seller.toString() !== req.user.sub && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (status === 'active') {
      product.available = true;
      product.hidden = false;
    } else if (status === 'inactive') {
      product.available = false;
      product.hidden = true; // farmer-initiated deactivation
    } else if (status === 'out_of_stock') {
      product.available = false;
      product.hidden = false; // still visible but not buyable
    }

    await product.save();
    res.json({ message: `Statut mis à jour : ${status}`, product });
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
