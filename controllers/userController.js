const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Donation = require('../models/Donation');

const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await User.find({ role: 'donor' })
      .sort({ points: -1 })
      .limit(10)
      .select('name points badges donationCount donorType');
    return res.status(200).json({ success: true, leaderboard });
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, location, language, donorType, phone, address } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
      user.email = email;
    }

    if (name) user.name = name;
    if (location) user.location = location;
    if (language) user.language = language;
    if (donorType) user.donorType = donorType;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (req.file && req.file.path) user.profilePic = req.file.path;
    await user.save({ validateBeforeSave: false });
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ success: true, user: userObj });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new passwords are required' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Incorrect current password' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json({ success: true, users });
  } catch (err) { next(err); }
};

// Admin: create a user manually
const adminCreateUser = async (req, res, next) => {
  try {
    const { name, email, password, role, location, address, mapLink, phone, language, donorType } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password || 'rescuebite123', 10);
    const userData = { name, email, password: hashedPassword, role, location, address, mapLink, phone, language };
    if (role === 'donor') userData.donorType = donorType || 'individual';
    const user = await User.create(userData);
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(201).json({ success: true, user: userObj });
  } catch (err) { next(err); }
};

// Admin: delete a user and their donations
const adminDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts' });
    await Donation.deleteMany({ donorId: user._id });
    await user.deleteOne();
    return res.status(200).json({ success: true, message: 'User and their donations deleted' });
  } catch (err) { next(err); }
};

// Admin: update any user's role, points, or basic info
const adminUpdateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { name, email, role, points, location, address, phone, donorType } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && role !== 'admin') user.role = role;
    if (points !== undefined) user.points = Number(points);
    if (location) user.location = location;
    if (address) user.address = address;
    if (phone) user.phone = phone;
    if (donorType) user.donorType = donorType;
    await user.save({ validateBeforeSave: false });
    const userObj = user.toObject();
    delete userObj.password;
    return res.status(200).json({ success: true, user: userObj });
  } catch (err) { next(err); }
};

// Admin: reset a user's password
const adminResetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (err) { next(err); }
};

// Admin: get a single user with their donations
const adminGetUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const donations = await Donation.find({ donorId: user._id }).sort({ createdAt: -1 }).limit(20);
    return res.status(200).json({ success: true, user, donations });
  } catch (err) { next(err); }
};

module.exports = {
  getLeaderboard, getProfile, updateProfile, changePassword, getAllUsers,
  adminCreateUser, adminDeleteUser, adminUpdateUser, adminResetPassword, adminGetUser,
};
