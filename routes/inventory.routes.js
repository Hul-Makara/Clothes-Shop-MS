const express = require('express');
const router = express.Router();
const {
  getInventoryMovements,
  getProductInventory,
  getLowStockProducts,
  adjustInventory,
  getInventorySummary
} = require('../controllers/inventory.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/summary', protect, authorize('admin', 'manager'), getInventorySummary);
router.get('/low-stock', protect, getLowStockProducts);
router.get('/product/:productId', protect, getProductInventory);
router.post('/adjust', protect, authorize('admin', 'manager'), adjustInventory);

router.route('/')
  .get(protect, getInventoryMovements);

module.exports = router;