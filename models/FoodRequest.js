const mongoose = require('mongoose');

const foodRequestSchema = new mongoose.Schema({
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantityNeeded: { type: String, required: true, trim: true },
  status: { type: String, enum: ['active', 'fulfilled', 'cancelled'], default: 'active' },
  fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FoodRequest', foodRequestSchema);
