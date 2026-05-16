const express = require('express');
const router = express.Router();
const { register, login, refreshToken, logout, sendOtp, forgotPassword, verifyOtp, resetPassword } = require('../controllers/authController');

router.post('/send-otp', sendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;
