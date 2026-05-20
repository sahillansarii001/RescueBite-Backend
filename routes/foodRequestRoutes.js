import express from "express";
const router = express.Router();
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import {
  createRequest,
  getActiveRequests,
  getMyRequests,
  acceptRequest,
  markPrepared,
  sendRequestCollectOtp,
  collectRequest,
  completeRequest,
  getDonorAcceptedRequests,
  getAllRequests,
  deleteRequest,
} from "../controllers/foodRequestController.js";

router.post("/", protect, restrictTo("ngo"), createRequest);
router.get("/my-requests", protect, restrictTo("ngo"), getMyRequests);
router.get("/active", protect, restrictTo("donor", "admin"), getActiveRequests);
router.get(
  "/donor-accepted",
  protect,
  restrictTo("donor"),
  getDonorAcceptedRequests,
);
router.get("/", protect, restrictTo("admin"), getAllRequests);
router.put("/:id/accept", protect, restrictTo("donor"), acceptRequest);
router.put("/:id/prepared", protect, restrictTo("donor"), markPrepared);
router.post(
  "/:id/send-collect-otp",
  protect,
  restrictTo("ngo"),
  sendRequestCollectOtp,
);
router.put("/:id/collect", protect, restrictTo("ngo"), collectRequest);
router.put("/:id/complete", protect, restrictTo("ngo"), completeRequest);
router.delete("/:id", protect, restrictTo("ngo", "admin"), deleteRequest);

export default router;
