const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getCategories)  // Public
  .post(protect, authorize('admin', 'manager'), createCategory);

router.route('/:id')
  .get(getCategoryById)  // Public
  .put(protect, authorize('admin', 'manager'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

module.exports = router;