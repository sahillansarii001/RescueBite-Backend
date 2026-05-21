import express from "express";
const router = express.Router();
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { getAnalytics, getPublicAnalytics } from "../controllers/analyticsController.js";

router.get("/public", getPublicAnalytics);
router.get("/", protect, restrictTo("admin"), getAnalytics);

export default router;
