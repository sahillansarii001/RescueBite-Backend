const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, location, language, donorType, address, mapLink, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Validate required fields
    if (!address) return res.status(400).json({ success: false, message: 'Address is required' });
    if (!mapLink) return res.status(400).json({ success: false, message: 'Google Maps link is required' });
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

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

    return res.status(201).json({
      success: true,
      token,
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
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      token,
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

module.exports = { register, login };
