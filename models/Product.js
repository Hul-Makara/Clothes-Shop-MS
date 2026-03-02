const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { 
    type: String, 
    required: true, 
    unique: true 
  },
  barcode: String,
  name: { 
    type: String, 
    required: true 
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    required: true 
  },
  brand: String,
  size: String,
  color: String,
  purchasePrice: { 
    type: Number, 
    required: true,
    min: 0 
  },
  sellingPrice: { 
    type: Number, 
    required: true,
    min: 0 
  },
  currentStock: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  minStockLevel: { 
    type: Number, 
    default: 5 
  },
  images: [String],
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// Auto-generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku) {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.sku = `PRD-${Date.now().toString().slice(-6)}${random}`;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);