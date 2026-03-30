import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    // Simulated gateway fields (mirrors real gateway structure)
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
      default: "",
    },
    method: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet"],
      default: "card",
    },
    refundId: {
      type: String,
      default: "",
    },
    refundedAt: {
      type: Date,
    },
    metadata: {
      cardLast4: String,
      cardBrand: String,
      upiId: String,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, event: 1 });

export default mongoose.model("Payment", paymentSchema);
