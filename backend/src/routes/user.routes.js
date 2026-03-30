import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  updateProfile,
  updateAvatar,
  changePassword,
  updateNotificationPreferences,
  getPublicProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

// @route   PUT /api/users/profile
// @desc    Update logged-in user's profile (name, bio, interests, socialLinks)
// @access  Private
router.put("/profile", protect, updateProfile);

// @route   PUT /api/users/avatar
// @desc    Upload/update avatar image
// @access  Private
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);

// @route   PUT /api/users/password
// @desc    Change password (requires current password)
// @access  Private
router.put("/password", protect, changePassword);

// @route   PUT /api/users/notification-preferences
// @desc    Update notification preferences
// @access  Private
router.put("/notification-preferences", protect, updateNotificationPreferences);

// @route   GET /api/users/:id/public
// @desc    Get public profile of any user (for organizer pages)
// @access  Public
router.get("/:id/public", getPublicProfile);

export default router;
