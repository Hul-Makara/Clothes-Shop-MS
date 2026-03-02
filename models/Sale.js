const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  name: String,
  quantity: { 
    type: Number, 
    required: true,
    min: 1 
  },
  price: { 
    type: Number, 
    required: true 
  },
  subtotal: { 
    type: Number, 
    required: true 
  }
});

const saleSchema = new mongoose.Schema({
  receiptNo: { 
    type: String, 
    required: true, 
    unique: true 
  },
  customerName: { 
    type: String, 
    default: 'Walk-in Customer' 
  },
  customerPhone: String,
  items: [saleItemSchema],
  subtotal: { 
    type: Number, 
    required: true 
  },
  discount: { 
    type: Number, 
    default: 0 
  },
  tax: { 
    type: Number, 
    default: 0 
  },
  total: { 
    type: Number, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'mobile'], 
    required: true 
  },
  cashierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { 
  timestamps: true 
});

// Generate receipt number
saleSchema.pre('save', async function(next) {
  if (!this.receiptNo) {
    const count = await mongoose.model('Sale').countDocuments();
    this.receiptNo = `RCP-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);