import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getPlatformStats,
  getUsers,
  updateUserRole,
  deleteUser,
  getAdminEvents,
  adminDeleteEvent,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect);
router.use(restrictTo("admin"));

// @route   GET /api/admin/stats
// @desc    Get platform-wide statistics
router.get("/stats", getPlatformStats);

// @route   GET /api/admin/users
// @desc    Get paginated user list (searchable, filterable by role)
router.get("/users", getUsers);

// @route   PATCH /api/admin/users/:userId/role
// @desc    Update a user's role
router.patch("/users/:userId/role", updateUserRole);

// @route   DELETE /api/admin/users/:userId
// @desc    Delete a user and all their data
router.delete("/users/:userId", deleteUser);

// @route   GET /api/admin/events
// @desc    Get all events for moderation
router.get("/events", getAdminEvents);

// @route   DELETE /api/admin/events/:eventId
// @desc    Delete an event (admin moderation)
router.delete("/events/:eventId", adminDeleteEvent);

export default router;
