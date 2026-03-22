require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

async function seedAdmin() {
  // Initialiser le modèle User
  const User = require('../models/User');

  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@agroconnect.bf' });
  
  if (existing) {
    console.log('Admin déjà existant. Mise à jour du mot de passe...');
    existing.passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@AgroConnect2026!', 12);
    await existing.save();
    console.log('Mot de passe admin mis à jour !');
    return;
  }

  await User.create({
    email:        process.env.ADMIN_EMAIL || 'admin@agroconnect.bf',
    passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@AgroConnect2026!', 12),
    firstName:    'Super',
    lastName:     'Admin',
    phone:        '+22600000000',
    role:         'ADMIN',
    canSell:      false,
    canBuy:       false,
    isVerified:   true,
    isActive:     true,
  });

  console.log(`Admin créé : ${process.env.ADMIN_EMAIL || 'admin@agroconnect.bf'}`);
  console.log('Changez le mot de passe avant la démo !');
}

// Si exécuté directement
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => seedAdmin())
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1); });
}

module.exports = { seedAdmin };
