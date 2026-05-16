const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, sendOtp } = require('../controllers/authController');

router.post('/send-otp', sendOtp);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;
