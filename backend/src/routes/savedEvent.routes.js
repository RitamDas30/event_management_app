import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  saveEvent,
  unsaveEvent,
  getMySavedEvents,
  isEventSaved,
} from "../controllers/savedEvent.controller.js";

const router = express.Router();

// @route   GET /api/saved-events
// @desc    Get all saved events for logged-in user
// @access  Private
router.get("/", protect, getMySavedEvents);

// @route   GET /api/saved-events/:eventId/check
// @desc    Check if an event is saved
// @access  Private
router.get("/:eventId/check", protect, isEventSaved);

// @route   POST /api/saved-events/:eventId
// @desc    Save/bookmark an event
// @access  Private
router.post("/:eventId", protect, saveEvent);

// @route   DELETE /api/saved-events/:eventId
// @desc    Unsave/remove bookmark
// @access  Private
router.delete("/:eventId", protect, unsaveEvent);

export default router;
