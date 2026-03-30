import Payment from "../models/payment.model.js";
import Event from "../models/event.model.js";
import Registration from "../models/registration.model.js";
import { createNotification } from "./notification.controller.js";
import logger from "../config/logger.js";
import crypto from "crypto";

// Simulate gateway processing delay
const simulateGatewayDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

// Generate mock IDs (same format as Razorpay)
const generateOrderId = () => `order_${crypto.randomBytes(12).toString("hex")}`;
const generatePaymentId = () => `pay_${crypto.randomBytes(12).toString("hex")}`;
const generateRefundId = () => `rfnd_${crypto.randomBytes(12).toString("hex")}`;

// =========================================================
// 1. CREATE ORDER (Step 1 of payment flow)
// =========================================================
export const createOrder = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.price <= 0) {
      return res.status(400).json({ message: "This is a free event — no payment needed" });
    }

    // Check if already paid
    const existingPayment = await Payment.findOne({
      user: req.user.id,
      event: eventId,
      status: "completed",
    });
    if (existingPayment) {
      return res.status(409).json({ message: "You have already paid for this event" });
    }

    const orderId = generateOrderId();

    const payment = await Payment.create({
      user: req.user.id,
      event: eventId,
      amount: event.price,
      orderId,
      status: "pending",
    });

    logger.info({ userId: req.user.id, eventId, orderId }, "Payment order created");

    res.status(201).json({
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      eventTitle: event.title,
      // In a real app, this would be a Razorpay/Stripe client secret
      key: "mock_key_for_demo",
    });
  } catch (error) {
    logger.error({ err: error }, "Create order failed");
    res.status(500).json({ message: "Failed to create order" });
  }
};

// =========================================================
// 2. VERIFY PAYMENT (Step 2 — after "gateway" processes)
// =========================================================
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, cardLast4, cardBrand, upiId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const payment = await Payment.findOne({ orderId, user: req.user.id });
    if (!payment) return res.status(404).json({ message: "Order not found" });

    if (payment.status === "completed") {
      return res.status(409).json({ message: "Payment already completed" });
    }

    // Simulate gateway processing
    await simulateGatewayDelay();

    // Simulate success (in real app, verify signature from gateway)
    // 5% chance of failure for realism
    const isSuccess = Math.random() > 0.05;

    if (!isSuccess) {
      payment.status = "failed";
      await payment.save();
      return res.status(402).json({ message: "Payment failed. Please try again." });
    }

    // Mark payment as completed
    payment.status = "completed";
    payment.paymentId = generatePaymentId();
    payment.method = paymentMethod || "card";
    payment.metadata = {
      cardLast4: cardLast4 || "4242",
      cardBrand: cardBrand || "Visa",
      upiId: upiId || "",
    };
    await payment.save();

    // Create notification
    const event = await Event.findById(payment.event);
    createNotification({
      user: req.user.id,
      type: "registration",
      title: "Payment Successful",
      message: `Payment of ₹${payment.amount} for "${event?.title}" was successful.`,
      link: `/events/${payment.event}`,
      event: payment.event,
    });

    logger.info({ userId: req.user.id, orderId, paymentId: payment.paymentId }, "Payment verified");

    res.json({
      message: "Payment successful",
      paymentId: payment.paymentId,
      amount: payment.amount,
      status: "completed",
    });
  } catch (error) {
    logger.error({ err: error }, "Verify payment failed");
    res.status(500).json({ message: "Payment verification failed" });
  }
};

// =========================================================
// 3. REFUND PAYMENT (on registration cancellation)
// =========================================================
export const refundPayment = async (req, res) => {
  try {
    const { eventId } = req.params;

    const payment = await Payment.findOne({
      user: req.user.id,
      event: eventId,
      status: "completed",
    });

    if (!payment) {
      return res.status(404).json({ message: "No completed payment found for this event" });
    }

    // Simulate refund processing
    await simulateGatewayDelay();

    payment.status = "refunded";
    payment.refundId = generateRefundId();
    payment.refundedAt = new Date();
    await payment.save();

    // Notify user
    const event = await Event.findById(eventId);
    createNotification({
      user: req.user.id,
      type: "system",
      title: "Refund Processed",
      message: `₹${payment.amount} refunded for "${event?.title}". Refund ID: ${payment.refundId}`,
      link: `/events/${eventId}`,
      event: eventId,
    });

    logger.info({ userId: req.user.id, eventId, refundId: payment.refundId }, "Payment refunded");

    res.json({
      message: "Refund processed successfully",
      refundId: payment.refundId,
      amount: payment.amount,
    });
  } catch (error) {
    logger.error({ err: error }, "Refund failed");
    res.status(500).json({ message: "Refund failed" });
  }
};

// =========================================================
// 4. GET MY PAYMENTS
// =========================================================
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate("event", "title startTime category imageUrl")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    logger.error({ err: error }, "Fetch payments failed");
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// =========================================================
// 5. GET PAYMENT BY ORDER ID
// =========================================================
export const getPaymentByOrderId = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
      user: req.user.id,
    }).populate("event", "title");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch payment" });
  }
};
