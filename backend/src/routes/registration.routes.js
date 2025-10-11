import express from "express";
import {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
} from "../controllers/registration.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   POST /api/registrations/:eventId
// @desc    Register for an event
// @access  Private (students)
router.post("/:eventId", protect, restrictTo("student"), registerForEvent);
 
// @route   DELETE /api/registrations/:eventId
// @desc    Cancel registration
// @access  Private (students)
router.delete("/:eventId", protect, restrictTo("student"), cancelRegistration);

// @route   GET /api/registrations/me
// @desc    Get my registrations
// @access  Private (students)
router.get("/me", protect, restrictTo("student"), getMyRegistrations);

export default router;
