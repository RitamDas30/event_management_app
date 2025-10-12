import express from "express";
import {
  register, // 🛑 CORRECTED: Use 'register' instead of 'registerUser'
  login,      // 🛑 CORRECTED: Use 'login' instead of 'loginUser'
  getProfile, // 🛑 CORRECTED: Use 'getProfile' instead of 'getCurrentUser'
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", register); // 🛑 Using correct import name

// @route   POST /api/auth/login
// @desc    Login user & get JWT
// @access  Public
router.post("/login", login); // 🛑 Using correct import name

// @route   GET /api/auth/me
// @desc    Get logged-in user's details
// @access  Private - Requires 'protect' middleware
router.get("/me", protect, getProfile); // 🛑 Using correct import name

// 🟢 NEW ROUTES FOR PASSWORD RESET
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword', resetPassword); 

export default router;