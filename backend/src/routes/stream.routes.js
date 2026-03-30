import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import Event from "../models/event.model.js";
import logger from "../config/logger.js";

const router = express.Router();

// @route   PATCH /api/events/:id/stream/start
// @desc    Organizer marks stream as live
// @access  Private (organizer of the event only)
router.patch("/:id/stream/start", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isOwner =
      event.organizer.toString() === req.user.id ||
      event.organizer.toString() === req.user._id?.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the event organizer can start the stream" });
    }

    event.streamConfig.isLive = true;
    await event.save();

    logger.info({ eventId: event._id, userId: req.user.id }, "Stream started");
    res.json({ message: "Stream started", isLive: true });
  } catch (error) {
    logger.error({ err: error }, "Start stream failed");
    res.status(500).json({ message: "Failed to start stream" });
  }
});

// @route   PATCH /api/events/:id/stream/end
// @desc    Organizer marks stream as ended
// @access  Private (organizer of the event only)
router.patch("/:id/stream/end", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isOwner =
      event.organizer.toString() === req.user.id ||
      event.organizer.toString() === req.user._id?.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the event organizer can end the stream" });
    }

    event.streamConfig.isLive = false;
    await event.save();

    logger.info({ eventId: event._id, userId: req.user.id }, "Stream ended");
    res.json({ message: "Stream ended", isLive: false });
  } catch (error) {
    logger.error({ err: error }, "End stream failed");
    res.status(500).json({ message: "Failed to end stream" });
  }
});

// @route   GET /api/events/:id/stream/status
// @desc    Check if stream is live (public)
// @access  Public
router.get("/:id/stream/status", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select("streamConfig title");
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.json({
      isLive: event.streamConfig?.isLive || false,
      roomId: event.streamConfig?.roomId || "",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to check stream status" });
  }
});

export default router;
