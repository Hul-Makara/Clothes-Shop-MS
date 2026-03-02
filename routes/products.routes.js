const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth');

// Special routes first
router.get('/low-stock', protect, getLowStockProducts);
router.put('/:id/stock', protect, updateStock);

// Standard CRUD routes
router.route('/')
    .get(getProducts)  // Public
    .post(protect, authorize('admin', 'manager'), createProduct);

router.route('/:id')
    .get(getProductById)  // Public
    .put(protect, authorize('admin', 'manager'), updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;