const express = require('express');
const router = express.Router();
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus,
  getPurchaseSummary
} = require('../controllers/purchase.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/summary', protect, authorize('admin', 'manager'), getPurchaseSummary);
router.put('/:id/status', protect, authorize('admin', 'manager'), updatePurchaseStatus);

router.route('/')
  .get(protect, getPurchases)
  .post(protect, authorize('admin', 'manager'), createPurchase);

router.route('/:id')
  .get(protect, getPurchaseById);

module.exports = router;