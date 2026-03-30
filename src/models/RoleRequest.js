const mongoose = require('mongoose');

const roleRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestedRole: {
    type: String,
    enum: ['FARMER', 'TRANSPORTER'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  details: {
    // Dynamic fields depending on the role requested
    // For FARMER: farmName, location, mainCrops, description, documents...
    // For TRANSPORTER: vehicle type, plate, coverage area...
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  adminComment: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RoleRequest', roleRequestSchema);
