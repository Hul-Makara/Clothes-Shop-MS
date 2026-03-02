const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product',
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  total: { 
    type: Number, 
    required: true 
  }
});

const purchaseSchema = new mongoose.Schema({
  purchaseOrderNo: { 
    type: String, 
    required: true, 
    unique: true 
  },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Supplier',
    required: true 
  },
  invoiceNo: String,
  orderDate: { 
    type: Date, 
    default: Date.now 
  },
  receivedDate: Date,
  items: [purchaseItemSchema],
  subtotal: { 
    type: Number, 
    required: true 
  },
  tax: { 
    type: Number, 
    default: 0 
  },
  shipping: { 
    type: Number, 
    default: 0 
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'partial'], 
    default: 'pending' 
  },
  paymentMethod: String,
  status: { 
    type: String, 
    enum: ['pending', 'received', 'cancelled'], 
    default: 'pending' 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  }
}, { 
  timestamps: true 
});

// Generate PO number
purchaseSchema.pre('save', async function(next) {
  if (!this.purchaseOrderNo) {
    const count = await mongoose.model('Purchase').countDocuments();
    this.purchaseOrderNo = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);