const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email:        { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^[\w-\.\+]+@([\w-]+\.)+[\w-]{2,}$/, 'Format d\'email invalide']
  },
  passwordHash: { type: String, required: true },
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  phone:        { type: String },
  role:         { type: String, enum: ['FARMER','BUYER','TRANSPORTER','ADMIN','USER'], required: true },

  // Capacités dynamiques
  canSell: { type: Boolean, default: false },
  canBuy:  { type: Boolean, default: true  },
  canDeliver: { type: Boolean, default: false },

  // Vérification email OTP
  isVerified:  { type: Boolean, default: false },
  otpCode:     { type: String },   // stocké haché avec bcrypt
  otpExpires:  { type: Date   },
  otpAttempts: { type: Number, default: 0 },   // bloqué après 3 tentatives

  // Réinitialisation mot de passe
  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date   },

  // Portefeuille
  walletBalance: { type: Number, default: 0 },
  walletPending: { type: Number, default: 0 },
  totalEarned:   { type: Number, default: 0 },

  // Profil
  isActive:       { type: Boolean, default: true },
  profilePicture: { type: String  },
  city:           { type: String  },
  address:        { type: String  },
  vehicleType:    { type: String  },  // TRANSPORTER seulement
  specialty:      { type: String  },  // FARMER seulement

  // Notation
  ratings: [{
    from:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score:     { type: Number, min: 1, max: 5 },
    comment:   { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  totalRatings:  { type: Number, default: 0  },
}, { timestamps: true });

// Retirer les champs sensibles des réponses JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otpCode;
  delete obj.otpExpires;
  delete obj.otpAttempts;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
