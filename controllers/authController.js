const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, location, language, donorType, address, mapLink, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
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

module.exports = { register, login, refreshToken, logout };
