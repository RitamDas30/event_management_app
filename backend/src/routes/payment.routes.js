import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createOrder,
  verifyPayment,
  refundPayment,
  getMyPayments,
  getPaymentByOrderId,
} from "../controllers/payment.controller.js";

const router = express.Router();

// @route   POST /api/payments/:eventId/order
// @desc    Create a payment order for an event
// @access  Private
router.post("/:eventId/order", protect, createOrder);

// @route   POST /api/payments/verify
// @desc    Verify payment after mock gateway processes
// @access  Private
router.post("/verify", protect, verifyPayment);

// @route   POST /api/payments/:eventId/refund
// @desc    Request refund for a paid event registration
// @access  Private
router.post("/:eventId/refund", protect, refundPayment);

// @route   GET /api/payments
// @desc    Get all my payments
// @access  Private
router.get("/", protect, getMyPayments);

// @route   GET /api/payments/:orderId
// @desc    Get payment by order ID
// @access  Private
router.get("/:orderId", protect, getPaymentByOrderId);

export default router;
