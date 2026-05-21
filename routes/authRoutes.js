import express from "express";
const router = express.Router();
import https from "https";
import http from "http";
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

// PDF proxy: fetches a Cloudinary PDF and serves it inline so Chrome opens it in a new tab
router.get("/proxy-pdf", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing url parameter");

  // Only allow Cloudinary URLs to prevent open-proxy abuse
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).send("Invalid URL");
  }
  if (!parsedUrl.hostname.includes("cloudinary.com")) {
    return res.status(403).send("Only Cloudinary URLs are allowed");
  }

  const fetchAndPipe = (fetchUrl, redirectsLeft) => {
    if (redirectsLeft <= 0) {
      return res.status(502).send("Too many redirects");
    }
    let parsed;
    try {
      parsed = new URL(fetchUrl);
    } catch {
      return res.status(400).send("Invalid redirect URL");
    }

    const requester = parsed.protocol === "https:" ? https : http;
    requester
      .get(fetchUrl, (cloudRes) => {
        // Follow redirects (Cloudinary sometimes issues 301/302)
        if (cloudRes.statusCode >= 300 && cloudRes.statusCode < 400 && cloudRes.headers.location) {
          cloudRes.resume(); // drain the response body
          return fetchAndPipe(cloudRes.headers.location, redirectsLeft - 1);
        }
        if (cloudRes.statusCode >= 400) {
          return res
            .status(cloudRes.statusCode)
            .send("Failed to fetch document from Cloudinary");
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="ngo-document.pdf"`);
        res.setHeader("Cache-Control", "public, max-age=3600");
        cloudRes.pipe(res);
      })
      .on("error", (err) => {
        res.status(500).send("Error fetching document: " + err.message);
      });
  };

  fetchAndPipe(url, 5);
});


export default router;
