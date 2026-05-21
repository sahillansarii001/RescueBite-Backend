import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf");
    return {
      folder: "rescuebite/donations",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
      resource_type: isPdf ? "raw" : "auto",
    };
  },
});

const upload = multer({ storage });

const uploadSingle = upload.single("image");

export { upload, uploadSingle };
