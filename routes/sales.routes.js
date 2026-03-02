const express = require('express');
const router = express.Router();
const {
  getSales,
  getSaleById,
  createSale,
  getTodaySummary,
  getSalesReport
} = require('../controllers/sale.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/today/summary', protect, getTodaySummary);
router.get('/report', protect, authorize('admin', 'manager'), getSalesReport);

router.route('/')
  .get(protect, getSales)
  .post(protect, createSale);  // Cashiers can create sales

router.route('/:id')
  .get(protect, getSaleById);

module.exports = router;