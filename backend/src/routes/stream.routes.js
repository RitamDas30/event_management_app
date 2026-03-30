import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
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

// @route   POST /api/events/:id/stream/recording
// @desc    Upload recording file (organizer only)
// @access  Private
router.post("/:id/stream/recording", protect, upload.single("recording"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isOwner =
      event.organizer.toString() === req.user.id ||
      event.organizer.toString() === req.user._id?.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the event organizer can upload recordings" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No recording file provided" });
    }

    event.streamConfig.recordingUrl = req.file.path;
    await event.save();

    logger.info({ eventId: event._id, recordingUrl: req.file.path }, "Recording uploaded");
    res.json({ message: "Recording uploaded", recordingUrl: req.file.path });
  } catch (error) {
    logger.error({ err: error }, "Upload recording failed");
    res.status(500).json({ message: "Failed to upload recording" });
  }
});

// @route   DELETE /api/events/:id/stream/recording
// @desc    Remove recording URL (organizer only)
// @access  Private
router.delete("/:id/stream/recording", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isOwner =
      event.organizer.toString() === req.user.id ||
      event.organizer.toString() === req.user._id?.toString();

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    event.streamConfig.recordingUrl = "";
    await event.save();

    res.json({ message: "Recording removed" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove recording" });
  }
});

export default router;
