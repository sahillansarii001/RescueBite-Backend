import express from "express";
const router = express.Router();
import {
  register,
  login,
  refreshToken,
  logout,
  sendOtp,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/authController.js";
import { uploadSingle } from "../middleware/upload.js";

router.post("/send-otp", sendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

router.post("/upload", uploadSingle, (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  return res.status(200).json({ success: true, url: req.file.path });
});

export default router;
