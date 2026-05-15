const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['donor', 'ngo', 'admin'], required: true },
  points: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  language: { type: String, enum: ['en', 'hi', 'mr'], default: 'en' },
  location: { type: String, required: function() { return this.role !== 'admin'; }, trim: true },
  address: { type: String, required: function() { return this.role !== 'admin'; }, trim: true },
  mapLink: { type: String, required: function() { return this.role !== 'admin'; }, trim: true },
  phone: { type: String, required: function() { return this.role !== 'admin'; }, trim: true },
  donationCount: { type: Number, default: 0 },
  donorType: {
    type: String,
    enum: ['individual', 'restaurant', 'marriage_hall', 'hotel', 'other'],
    default: undefined,
  },
  profilePic: { type: String, default: '' },
  refreshToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
