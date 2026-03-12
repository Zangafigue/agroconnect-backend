const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price:       { type: Number, required: true, min: 0 },
  unit:        { type: String, required: true, enum: ['kg','sac','tonne','litre','unité','caisse'] },
  quantity:    { type: Number, required: true, min: 0 },
  category:    { type: String, required: true, enum: ['Céréales','Légumes','Fruits','Élevage','Semences','Autres'] },
  images:      [{ type: String }],
  city:        { type: String, required: true },
  address:     { type: String },
  lat:         { type: Number },
  lng:         { type: Number },
  available:   { type: Boolean, default: true },
  hidden:      { type: Boolean, default: false },  // masqué par Admin
}, { timestamps: true });

// Index pour la recherche
productSchema.index({ available: 1, hidden: 1, category: 1, city: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
