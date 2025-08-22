import { RequestHandler } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

export const uploadMiddleware = upload.single("image");

// Simple file upload handler
// In production, you would use cloud storage (AWS S3, Google Cloud Storage, etc.)
export const uploadImage: RequestHandler = (req, res) => {
  try {
    // For demo purposes, return a working image URL from a reliable source
    // You can replace this with actual file upload logic when ready
    const sampleImages = [
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558618798-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ];

    const randomIndex = Math.floor(Math.random() * sampleImages.length);
    const imageUrl = sampleImages[randomIndex];

    res.json({
      success: true,
      data: {
        url: imageUrl,
        filename: `uploaded_image_${Date.now()}.jpg`,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to upload image",
    });
  }
};

// Delete uploaded image
export const deleteImage: RequestHandler = (req, res) => {
  try {
    const { url } = req.body;

    // In production, implement actual file deletion logic
    // For now, just return success

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete image",
    });
  }
};
