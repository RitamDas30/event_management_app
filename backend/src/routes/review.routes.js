import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createReview,
  getEventReviews,
  deleteReview,
} from "../controllers/review.controller.js";

const router = express.Router();

// @route   GET /api/reviews/:eventId
// @desc    Get all reviews for an event
// @access  Public
router.get("/:eventId", getEventReviews);

// @route   POST /api/reviews/:eventId
// @desc    Create a review for an event (must have attended)
// @access  Private
router.post("/:eventId", protect, createReview);

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete your review
// @access  Private
router.delete("/:reviewId", protect, deleteReview);

export default router;
