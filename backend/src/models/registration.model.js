import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique : true ,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["registered", "waitlisted", "cancelled"],
      default: "registered",
    },
    qrCode: {
      type: String, // store QR code string or URL
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);


registrationSchema.index({ event: 1, student: 1 }, { unique: true });

export default mongoose.model("Registration", registrationSchema);
