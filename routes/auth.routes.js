const express = require('express');
const router = express.Router();
const { register, login, getProfile, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/logout', logout);

module.exports = router;