import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
// 🟢 NEW: Import the Multer upload middleware
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get("/", getEvents);

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get("/:id", getEventById);

// @route   POST /api/events
// @desc    Create new event (organizer only)
// @access  Private
router.post(
  "/",
  protect,
  restrictTo("organizer", "admin"),
  // 🟢 NEW: Multer middleware handles file upload before the controller
  upload.single("image"), // Expects the field name 'image' from the form
  createEvent
);

// @route   PUT /api/events/:id
// @desc    Update event (organizer only)
// @access  Private
router.put("/:id", protect, restrictTo("organizer", "admin"), updateEvent);

// @route   DELETE /api/events/:id
// @desc    Delete event (organizer only)
// @access  Private
router.delete("/:id", protect, restrictTo("organizer", "admin"), deleteEvent);

export default router;