import mongoose from "mongoose";

const foodRequestSchema = new mongoose.Schema({
  ngoId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quantityNeeded: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: [
      "active",
      "accepted",
      "prepared",
      "collected",
      "completed",
      "cancelled",
    ],
    default: "active",
  },
  fulfilledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  }, // the donor
  prepTime: { type: String, default: null },
  collectOtp: { type: String, default: null },
  impactDetails: {
    peopleFed: { type: Number },
    usedLocation: { type: String },
    description: { type: String },
    submitted: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

export default mongoose.model("FoodRequest", foodRequestSchema);
