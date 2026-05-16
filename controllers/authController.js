const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');

const generateToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email });
    await Otp.create({ email, otp: otpCode });

    if (process.env.MAIL_PASS) {
      try {
        await sendEmail({
          email,
          subject: 'RescueBite - Password Reset Code',
          message: `Your password reset code is: ${otpCode}. It will expire in 10 minutes.`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #166534; text-align: center;">Password Reset Request</h2>
                  <p style="font-size: 16px; color: #475569;">Hello ${user.name},</p>
                  <p style="font-size: 16px; color: #475569;">You requested a password reset for your RescueBite account. Your one-time verification code is:</p>
                  <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #15803d;">${otpCode}</span>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">This code will expire in 10 minutes.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you didn't request this, please ignore this email.</p>
                 </div>`
        });
      } catch (emailErr) {
        console.error('Email failed to send:', emailErr);
        return res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
      }
    } else {
      console.log(`\n\n=== PASSWORD RESET EMAIL BYPASSED ===\nTo: ${email}\nOTP: ${otpCode}\n=====================================\n\n`);
    }

    return res.status(200).json({ success: true, message: 'Password reset OTP sent to email' });
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save({ validateBeforeSave: false });
    
    await Otp.deleteMany({ email });

    return res.status(200).json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required for OTP' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete existing OTP for this email if any
    await Otp.deleteMany({ email });

    await Otp.create({ email, phone, otp: otpCode });

    // Send Email if configured
    if (process.env.MAIL_PASS) {
      try {
        await sendEmail({
          email,
          subject: 'RescueBite - Registration Verification Code',
          message: `Your verification code is: ${otpCode}. It will expire in 10 minutes.`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #166534; text-align: center;">RescueBite Verification</h2>
                  <p style="font-size: 16px; color: #475569;">Hello,</p>
                  <p style="font-size: 16px; color: #475569;">Thank you for starting your registration with RescueBite. Your one-time verification code is:</p>
                  <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #15803d;">${otpCode}</span>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">This code will expire in 10 minutes.</p>
                  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                  <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you didn't request this, please ignore this email.</p>
                 </div>`
        });
      } catch (emailErr) {
        console.error('Email failed to send:', emailErr);
        return res.status(500).json({ success: false, message: 'Failed to send OTP email. Make sure email settings are correct.' });
      }
    } else {
      console.log(`\n\n=== EMAIL BYPASSED (MAIL_PASS NOT SET) ===\nTo: ${email}\nOTP: ${otpCode}\n==========================================\n\n`);
    }

    return res.status(200).json({ success: true, message: 'OTP sent successfully to email' });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, location, language, donorType, address, mapLink, phone, otp } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (role !== 'admin') {
      if (!otp) {
        return res.status(400).json({ success: false, message: 'OTP is required for registration' });
      }

      // Verify OTP
      const otpRecord = await Otp.findOne({ email, otp });
      if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }
    }

    // Validate required fields (skip for admin)
    if (role !== 'admin') {
      if (!address) return res.status(400).json({ success: false, message: 'Address is required' });
      if (!mapLink) return res.status(400).json({ success: false, message: 'Google Maps link is required' });
      if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      location,
      language,
      address,
      mapLink,
      phone,
    };
    // Only set donorType for donor role to avoid enum validation error
    if (role === 'donor' && donorType) userData.donorType = donorType;
    else if (role === 'donor') userData.donorType = 'individual';

    const user = await User.create(userData);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    if (role !== 'admin') {
      await Otp.deleteMany({ email });
    }

    return res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        donorType: user.donorType,
        points: user.points,
        badges: user.badges,
        language: user.language,
        location: user.location,
        address: user.address,
        mapLink: user.mapLink,
        phone: user.phone,
      },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Secure Admin Login via .env credentials
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const adminUser = {
        _id: 'admin_env_id_001',
        name: 'System Admin',
        email: process.env.ADMIN_EMAIL,
        role: 'admin',
      };
      
      const token = generateToken(adminUser);
      const refreshToken = generateRefreshToken(adminUser);
      
      return res.status(200).json({
        success: true,
        token,
        refreshToken,
        user: adminUser,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        donorType: user.donorType,
        points: user.points,
        badges: user.badges,
        language: user.language,
        location: user.location,
        address: user.address,
        mapLink: user.mapLink,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ success: false, message: 'Invalid refresh token' });
    }

    const newAccessToken = generateToken(user);
    
    return res.status(200).json({ success: true, token: newAccessToken });
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refreshToken, logout, sendOtp, forgotPassword, verifyOtp, resetPassword };
