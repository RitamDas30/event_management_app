import User from "../models/user.model.js";
import Event from "../models/event.model.js";
import Registration from "../models/registration.model.js";
import Review from "../models/review.model.js";
import Notification from "../models/notification.model.js";
import logger from "../config/logger.js";

// =========================================================
// 1. GET PLATFORM STATS
// =========================================================
export const getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalRegistrations, totalReviews] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Registration.countDocuments({ status: "registered" }),
      Review.countDocuments(),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const eventsByCategory = await Event.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const recentRegistrations = await Registration.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 86400000) },
      status: "registered",
    });

    res.json({
      totalUsers,
      totalEvents,
      totalRegistrations,
      totalReviews,
      recentRegistrations,
      usersByRole: Object.fromEntries(usersByRole.map((r) => [r._id, r.count])),
      eventsByCategory: Object.fromEntries(eventsByCategory.map((c) => [c._id, c.count])),
    });
  } catch (error) {
    logger.error({ err: error }, "Platform stats failed");
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// =========================================================
// 2. GET ALL USERS (paginated, searchable)
// =========================================================
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const role = req.query.role || "";

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error({ err: error }, "Get users failed");
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// =========================================================
// 3. UPDATE USER ROLE
// =========================================================
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["student", "organizer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent self-demotion
    if (userId === req.user.id) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    logger.info({ adminId: req.user.id, userId, newRole: role }, "User role updated");
    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    logger.error({ err: error }, "Update role failed");
    res.status(500).json({ message: "Failed to update role" });
  }
};

// =========================================================
// 4. DELETE USER
// =========================================================
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Clean up related data
    await Promise.all([
      Registration.deleteMany({ student: userId }),
      Review.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId }),
    ]);

    logger.info({ adminId: req.user.id, deletedUserId: userId }, "User deleted");
    res.json({ message: `User ${user.name} deleted` });
  } catch (error) {
    logger.error({ err: error }, "Delete user failed");
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// =========================================================
// 5. GET ALL EVENTS (admin view, with organizer details)
// =========================================================
export const getAdminEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const category = req.query.category || "";

    const filter = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (category) filter.category = category;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter),
    ]);

    res.json({
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error({ err: error }, "Admin get events failed");
    res.status(500).json({ message: "Failed to fetch events" });
  }
};

// =========================================================
// 6. DELETE EVENT (admin moderation)
// =========================================================
export const adminDeleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await Registration.deleteMany({ event: req.params.eventId });
    await Review.deleteMany({ event: req.params.eventId });

    logger.info({ adminId: req.user.id, eventId: req.params.eventId }, "Event deleted by admin");
    res.json({ message: `Event "${event.title}" deleted` });
  } catch (error) {
    logger.error({ err: error }, "Admin delete event failed");
    res.status(500).json({ message: "Failed to delete event" });
  }
};
