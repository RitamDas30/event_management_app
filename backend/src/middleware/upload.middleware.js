// src/middleware/upload.middleware.js (NEW)
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Load environment variables for Cloudinary configuration
dotenv.config();

// 1. Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Define storage settings for multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "event_management_app/events", // Folder name in your Cloudinary account
    allowed_formats: ["jpg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }], // Optional optimization
  },
});

// 3. Define the final multer instance
export const upload = multer({ 
    storage: storage,
    // File size limit (e.g., 5MB)
    limits: { fileSize: 5 * 1024 * 1024 } 
});

// NOTE: We no longer need fs or path checks, as Multer uploads directly to the cloud.