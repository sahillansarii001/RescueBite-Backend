import express from "express";
const router = express.Router();
import { protect } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../middleware/upload.js";
import {
  createDonation,
  getAllDonations,
  getDonationById,
  updateDonationStatus,
  deleteDonation,
  addImpactDetails,
  sendCollectOtp,
} from "../controllers/donationController.js";

router.post("/", protect, uploadSingle, createDonation);
router.get("/", getAllDonations);
router.get("/:id", getDonationById);
router.put("/:id", protect, updateDonationStatus);
router.put("/:id/impact", protect, addImpactDetails);
router.delete("/:id", protect, deleteDonation);
router.post("/:id/send-collect-otp", protect, sendCollectOtp);

export default router;
