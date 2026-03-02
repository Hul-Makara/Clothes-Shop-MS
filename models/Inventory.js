const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  type: { 
    type: String, 
    enum: ['purchase', 'sale', 'return', 'damage'], 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  reference: String,
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  previousStock: { 
    type: Number, 
    required: true 
  },
  newStock: { 
    type: Number, 
    required: true 
  },
  notes: String,
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Inventory', inventorySchema);