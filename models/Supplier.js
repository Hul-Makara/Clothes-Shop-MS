const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    contactPerson: String,
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: String,
    gstNumber: String,
    paymentTerms: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);