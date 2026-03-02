const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplier.controller');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, authorize('admin', 'manager'), createSupplier);

router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, authorize('admin', 'manager'), updateSupplier)
  .delete(protect, authorize('admin'), deleteSupplier);

module.exports = router;