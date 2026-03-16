const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Atlas connecté');

    // Créer le compte admin au démarrage si inexistant
    const { seedAdmin } = require('../seed/admin.seed');
    await seedAdmin();
  } catch (err) {
    console.error('Erreur MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
