const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  addLoyaltyPoints,
  getCustomerByPhone
} = require('../controllers/customer.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/phone/:phone', protect, getCustomerByPhone);
router.put('/:id/loyalty', protect, addLoyaltyPoints);

router.route('/')
  .get(protect, getCustomers)
  .post(protect, createCustomer);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, updateCustomer)
  .delete(protect, authorize('admin'), deleteCustomer);

module.exports = router;