import express from "express";
const router = express.Router();
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import handleChat from "../controllers/chatController.js";

// Protect this route: only admin users can access the Gemini chatbot
router.post("/", protect, restrictTo("admin"), handleChat);

export default router;
