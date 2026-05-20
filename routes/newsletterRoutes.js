import express from "express";
const router = express.Router();
import { subscribe } from "../controllers/newsletterController.js";

router.post("/subscribe", subscribe);

export default router;
