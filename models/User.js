import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ["donor", "ngo", "admin"], required: true },
  points: { type: Number, default: 0 },
  badges: { type: [String], default: [] },

  location: {
    type: String,
    required: function () {
      return this.role !== "admin";
    },
    trim: true,
  },
  address: {
    type: String,
    required: function () {
      return this.role !== "admin";
    },
    trim: true,
  },
  mapLink: {
    type: String,
    required: function () {
      return this.role !== "admin";
    },
    trim: true,
  },
  phone: {
    type: String,
    required: function () {
      return this.role !== "admin";
    },
    trim: true,
  },
  donationCount: { type: Number, default: 0 },
  donorType: {
    type: String,
    enum: ["individual", "restaurant", "marriage_hall", "hotel", "other"],
    default: undefined,
  },
  profilePic: { type: String, default: "" },
  refreshToken: { type: String },
  isVerified: { type: Boolean, default: false },
  websiteLink: { type: String, trim: true },
  ngoDocument: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
