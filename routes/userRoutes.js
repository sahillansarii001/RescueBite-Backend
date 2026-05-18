const express = require("express");
const router = express.Router();
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/upload");
const {
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
} = require("../controllers/userController");
const { registerStream } = require("../utils/sse");

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

module.exports = router;
