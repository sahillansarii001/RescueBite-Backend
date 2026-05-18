const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
  foodName: { type: String, required: true, trim: true },
  quantity: { type: String, required: true },
  foodType: {
    type: String,
    enum: ["cooked", "raw", "packaged"],
    required: true,
  },
  expiryTime: { type: Date, required: true },
  image: { type: String, default: "" },
  location: { type: String, required: true },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["pending", "accepted", "collected", "completed"],
    default: "pending",
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  isRecurring: { type: Boolean, default: false },
  collectOtp: { type: String, default: null },
  impactDetails: {
    peopleFed: { type: Number },
    usedLocation: { type: String },
    description: { type: String },
    submitted: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Donation", donationSchema);
