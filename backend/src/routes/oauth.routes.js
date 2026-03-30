import express from "express";
import { googleAuth, githubAuth, completeOAuthRegistration } from "../controllers/oauth.controller.js";

const router = express.Router();

// @route   POST /api/auth/google
// @desc    Authenticate with Google OAuth (returns user or needsRoleSelection)
// @access  Public
router.post("/google", googleAuth);

// @route   POST /api/auth/github
// @desc    Authenticate with GitHub OAuth (returns user or needsRoleSelection)
// @access  Public
router.post("/github", githubAuth);

// @route   POST /api/auth/oauth/complete
// @desc    Complete OAuth registration with role selection (for new users)
// @access  Public
router.post("/oauth/complete", completeOAuthRegistration);

export default router;
