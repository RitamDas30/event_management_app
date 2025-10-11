import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser, // This now matches the function name in the controller
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js"; // Middleware must be defined

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", registerUser);

// @route   POST /api/auth/login
// @desc    Login user & get JWT
// @access  Public
router.post("/login", loginUser);

// @route   GET /api/auth/me
// @desc    Get logged-in user's details
// @access  Private - Requires 'protect' middleware
router.get("/me", protect, getCurrentUser);

export default router;
