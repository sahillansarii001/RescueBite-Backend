import express from "express";
const router = express.Router();
import { sendContact } from "../controllers/contactController.js";

router.post("/", sendContact);

export default router;
