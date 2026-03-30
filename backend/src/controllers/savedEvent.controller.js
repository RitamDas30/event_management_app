import SavedEvent from "../models/savedEvent.model.js";
import logger from "../config/logger.js";

// =========================================================
// 1. SAVE/BOOKMARK AN EVENT
// =========================================================
export const saveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const existing = await SavedEvent.findOne({ user: req.user.id, event: eventId });
    if (existing) {
      return res.status(409).json({ message: "Event already saved" });
    }

    const saved = await SavedEvent.create({ user: req.user.id, event: eventId });

    logger.info({ userId: req.user.id, eventId }, "Event saved");
    res.status(201).json({ message: "Event saved", saved });
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Save event failed");
    res.status(500).json({ message: "Failed to save event: " + error.message });
  }
};

// =========================================================
// 2. UNSAVE/REMOVE BOOKMARK
// =========================================================
export const unsaveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await SavedEvent.findOneAndDelete({ user: req.user.id, event: eventId });
    if (!result) {
      return res.status(404).json({ message: "Saved event not found" });
    }

    logger.info({ userId: req.user.id, eventId }, "Event unsaved");
    res.json({ message: "Event removed from saved" });
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Unsave event failed");
    res.status(500).json({ message: "Failed to unsave event: " + error.message });
  }
};

// =========================================================
// 3. GET MY SAVED EVENTS
// =========================================================
export const getMySavedEvents = async (req, res) => {
  try {
    const savedEvents = await SavedEvent.find({ user: req.user.id })
      .populate("event")
      .sort({ createdAt: -1 });

    // Filter out null events (deleted events)
    const validSaved = savedEvents.filter((s) => s.event != null);

    res.json(validSaved.map((s) => s.event));
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Fetch saved events failed");
    res.status(500).json({ message: "Failed to fetch saved events: " + error.message });
  }
};

// =========================================================
// 4. CHECK IF EVENT IS SAVED
// =========================================================
export const isEventSaved = async (req, res) => {
  try {
    const { eventId } = req.params;
    const saved = await SavedEvent.findOne({ user: req.user.id, event: eventId });
    res.json({ saved: !!saved });
  } catch (error) {
    res.status(500).json({ message: "Failed to check saved status" });
  }
};
