require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedData() {
  const User = require('../models/User');
  const Product = require('../models/Product');

  console.log('🌱 Début du Data Seed...');

  // 1. Nettoyage optionnel (On garde l'admin, on vire le reste si on veut reset, ici on ajoute juste si n'existe pas)
  const farmerEmail = 'farmer@test.com';
  let farmer = await User.findOne({ email: farmerEmail });

  if (!farmer) {
    const passwordHash = await bcrypt.hash('password123', 12);
    farmer = await User.create({
      email: farmerEmail,
      passwordHash,
      firstName: 'Kader',
      lastName: 'Traoré',
      phone: '+22670000001',
      role: 'FARMER',
      canSell: true,
      canBuy: true,
      isVerified: true,
      isActive: true,
      city: 'Bobo-Dioulasso',
      specialty: 'Céréales et Légumes',
      walletBalance: 150000
    });
    console.log(`✅ Farmer Test créé: ${farmerEmail} / password123`);
  } else {
    console.log(`ℹ️ Farmer Test existe déjà: ${farmerEmail}`);
  }

  const buyerEmail = 'buyer@test.com';
  let buyer = await User.findOne({ email: buyerEmail });
  if (!buyer) {
    const passwordHash = await bcrypt.hash('password123', 12);
    buyer = await User.create({
      email: buyerEmail,
      passwordHash,
      firstName: 'Awa',
      lastName: 'Ouedraogo',
      phone: '+22670000002',
      role: 'BUYER',
      canSell: false,
      canBuy: true,
      isVerified: true,
      isActive: true,
      city: 'Ouagadougou',
      walletBalance: 500000
    });
    console.log(`✅ Buyer Test créé: ${buyerEmail} / password123`);
  }

  const transporterEmail = 'transporter@test.com';
  let transporter = await User.findOne({ email: transporterEmail });
  if (!transporter) {
    const passwordHash = await bcrypt.hash('password123', 12);
    transporter = await User.create({
      email: transporterEmail,
      passwordHash,
      firstName: 'Salif',
      lastName: 'Tapsoba',
      phone: '+22670000003',
      role: 'TRANSPORTER',
      canSell: false,
      canBuy: true,
      isVerified: true,
      isActive: true,
      city: 'Ouagadougou',
      vehicleType: 'Camionnette 3.5T'
    });
    console.log(`✅ Transporter Test créé: ${transporterEmail} / password123`);
  }

  // 2. Création de faux produits pour le Farmer
  const productsCount = await Product.countDocuments({ seller: farmer._id });
  if (productsCount === 0) {
    console.log('📦 Création de faux produits...');
    await Product.insertMany([
      {
        seller: farmer._id,
        name: 'Sacs de Maïs Blanc',
        description: 'Maïs blanc de très bonne qualité, récolte récente. Idéal pour la consommation ou la transformation.',
        price: 15000,
        unit: 'sac',
        quantity: 50,
        category: 'Céréales',
        images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&q=80&w=800'],
        city: 'Bobo-Dioulasso',
        available: true
      },
      {
        seller: farmer._id,
        name: 'Tomates Fraîches',
        description: 'Cagettes de tomates bien mûres cultivées sans pesticides agressifs.',
        price: 8000,
        unit: 'caisse',
        quantity: 20,
        category: 'Légumes',
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800'],
        city: 'Bobo-Dioulasso',
        available: true
      },
      {
        seller: farmer._id,
        name: 'Sésame Bio',
        description: 'Sésame trié, prêt pour l\'exportation ou la production d\'huile.',
        price: 45000,
        unit: 'sac',
        quantity: 10,
        category: 'Semences',
        images: ['https://images.unsplash.com/photo-1596646543596-3c0f209df344?auto=format&fit=crop&q=80&w=800'],
        city: 'Orodara',
        available: true
      }
    ]);
    console.log('✅ 3 Produits de test créés pour le Farmer.');
  } else {
    console.log('ℹ️ Les produits de test existent déjà.');
  }

  console.log('🎉 Seed Data terminé !');
  process.exit(0);
}

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => seedData())
    .catch(err => { console.error(err); process.exit(1); });
}
