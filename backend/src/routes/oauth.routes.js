import express from "express";
import { googleAuth, githubAuth } from "../controllers/oauth.controller.js";

const router = express.Router();

// @route   POST /api/auth/google
// @desc    Authenticate with Google OAuth
// @access  Public
router.post("/google", googleAuth);

// @route   POST /api/auth/github
// @desc    Authenticate with GitHub OAuth
// @access  Public
router.post("/github", githubAuth);

export default router;
