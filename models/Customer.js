const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: String,
  phone: String,
  address: String,
  loyaltyPoints: { 
    type: Number, 
    default: 0 
  },
  totalSpent: { 
    type: Number, 
    default: 0 
  },
  lastPurchase: Date
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Customer', customerSchema);