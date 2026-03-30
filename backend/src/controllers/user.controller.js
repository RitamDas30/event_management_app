import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import logger from "../config/logger.js";

// =========================================================
// 1. UPDATE PROFILE
// =========================================================
export const updateProfile = async (req, res) => {
  try {
    const { name, bio, interests, socialLinks } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (interests !== undefined) updateData.interests = interests;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    logger.info({ userId: user._id }, "Profile updated");
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Profile update failed");
    res.status(500).json({ message: "Failed to update profile: " + error.message });
  }
};

// =========================================================
// 2. UPDATE AVATAR
// =========================================================
export const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image provided" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: req.file.path },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    logger.info({ userId: user._id }, "Avatar updated");
    res.json({ message: "Avatar updated successfully", avatar: user.avatar });
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Avatar update failed");
    res.status(500).json({ message: "Failed to update avatar: " + error.message });
  }
};

// =========================================================
// 3. CHANGE PASSWORD
// =========================================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    logger.info({ userId: user._id }, "Password changed");
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Password change failed");
    res.status(500).json({ message: "Failed to change password: " + error.message });
  }
};

// =========================================================
// 4. UPDATE NOTIFICATION PREFERENCES
// =========================================================
export const updateNotificationPreferences = async (req, res) => {
  try {
    const { notificationPreferences } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { notificationPreferences },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    logger.info({ userId: user._id }, "Notification preferences updated");
    res.json({ message: "Preferences updated", notificationPreferences: user.notificationPreferences });
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Notification preferences update failed");
    res.status(500).json({ message: "Failed to update preferences: " + error.message });
  }
};

// =========================================================
// 5. GET PUBLIC PROFILE (for organizer pages)
// =========================================================
export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name avatar bio interests socialLinks role createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    logger.error({ err: error }, "Public profile fetch failed");
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
