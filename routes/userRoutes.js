import express from "express";
const router = express.Router();
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import {
  getLeaderboard,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  adminCreateUser,
  adminDeleteUser,
  adminUpdateUser,
  adminResetPassword,
  adminGetUser,
  adminVerifyNgo,
  adminRejectNgo,
  getNearestCounterparts,
} from "../controllers/userController.js";
import { registerStream } from "../utils/sse.js";

router.get("/register-stream", registerStream);
router.get("/leaderboard", getLeaderboard);
router.get("/profile", protect, getProfile);
router.get("/nearest", protect, getNearestCounterparts);
router.put("/profile", protect, upload.single("profilePic"), updateProfile);
router.put("/change-password", protect, changePassword);

// Admin-only routes
router.get("/all", protect, restrictTo("admin"), getAllUsers);
router.post("/admin/create", protect, restrictTo("admin"), adminCreateUser);
router.get("/admin/:id", protect, restrictTo("admin"), adminGetUser);
router.put("/admin/:id", protect, restrictTo("admin"), adminUpdateUser);
router.delete("/admin/:id", protect, restrictTo("admin"), adminDeleteUser);
router.put(
  "/admin/:id/reset-password",
  protect,
  restrictTo("admin"),
  adminResetPassword,
);
router.put("/admin/:id/verify", protect, restrictTo("admin"), adminVerifyNgo);
router.put("/admin/:id/reject", protect, restrictTo("admin"), adminRejectNgo);

export default router;
