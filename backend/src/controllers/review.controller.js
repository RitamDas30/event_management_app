import Review from "../models/review.model.js";
import Event from "../models/event.model.js";
import Registration from "../models/registration.model.js";
import logger from "../config/logger.js";

// =========================================================
// 1. CREATE REVIEW
// =========================================================
export const createReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    // Check event exists and is completed
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (new Date(event.endTime) > new Date()) {
      return res.status(400).json({ message: "You can only review events that have ended" });
    }

    // Check user was registered for the event
    const registration = await Registration.findOne({
      event: eventId,
      student: req.user.id,
      status: "registered",
    });

    if (!registration) {
      return res.status(403).json({ message: "You can only review events you attended" });
    }

    // Check for existing review
    const existing = await Review.findOne({ event: eventId, user: req.user.id });
    if (existing) {
      return res.status(409).json({ message: "You have already reviewed this event" });
    }

    const review = await Review.create({
      event: eventId,
      user: req.user.id,
      rating,
      comment,
    });

    const populated = await Review.findById(review._id).populate("user", "name avatar");

    logger.info({ userId: req.user.id, eventId }, "Review created");
    res.status(201).json({ message: "Review submitted", review: populated });
  } catch (error) {
    logger.error({ err: error }, "Create review failed");
    res.status(500).json({ message: "Failed to submit review: " + error.message });
  }
};

// =========================================================
// 2. GET REVIEWS FOR EVENT
// =========================================================
export const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;

    const reviews = await Review.find({ event: eventId })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    logger.error({ err: error }, "Fetch reviews failed");
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};

// =========================================================
// 3. DELETE MY REVIEW
// =========================================================
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: req.user.id,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    logger.info({ userId: req.user.id, reviewId }, "Review deleted");
    res.json({ message: "Review deleted" });
  } catch (error) {
    logger.error({ err: error }, "Delete review failed");
    res.status(500).json({ message: "Failed to delete review" });
  }
};
