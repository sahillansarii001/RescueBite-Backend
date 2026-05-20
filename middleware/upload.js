import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "rescuebite/donations",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  }),
});

const upload = multer({ storage });

const uploadSingle = upload.single("image");

export { upload, uploadSingle };
