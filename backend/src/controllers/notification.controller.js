import Notification from "../models/notification.model.js";
import logger from "../config/logger.js";

// =========================================================
// 1. GET MY NOTIFICATIONS
// =========================================================
export const getMyNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("event", "title"),
      Notification.countDocuments({ user: req.user.id }),
      Notification.countDocuments({ user: req.user.id, read: false }),
    ]);

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Fetch notifications failed");
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

// =========================================================
// 2. GET UNREAD COUNT
// =========================================================
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: "Failed to get unread count" });
  }
};

// =========================================================
// 3. MARK AS READ
// =========================================================
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Marked as read", notification });
  } catch (error) {
    logger.error({ err: error }, "Mark notification read failed");
    res.status(500).json({ message: "Failed to mark as read" });
  }
};

// =========================================================
// 4. MARK ALL AS READ
// =========================================================
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Mark all read failed");
    res.status(500).json({ message: "Failed to mark all as read" });
  }
};

// =========================================================
// 5. DELETE NOTIFICATION
// =========================================================
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    logger.error({ err: error }, "Delete notification failed");
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

// =========================================================
// HELPER: Create notification (used by other controllers)
// =========================================================
export const createNotification = async ({ user, type, title, message, link, event }) => {
  try {
    await Notification.create({ user, type, title, message, link, event });
  } catch (error) {
    logger.error({ err: error, userId: user }, "Failed to create notification");
  }
};
