import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
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
      type: String, // Base64 encoded image (Data URL)
    },
    // 🟢 AUDIT FIELD: Records the exact time the registration was cancelled (used for 15-min ban)
    cancelledAt: {
      type: Date,
      default: null, 
    },
    // 🟢 UNENROLLMENT REASON: The quick reason chosen from the modal
    cancellationReason: {
        type: String,
        default: null,
    },
    // 🟢 NEW FIELD: Detailed text input if the reason was "Other"
    cancellationDetails: { 
        type: String,
        default: null,
    }
  },
  { timestamps: true }
);

// 🛑 CRITICAL FIX: Ensures a student can only have ONE active/cancelled registration per event.
// This prevents duplicate entries and is the basis for waitlist/unenrollment logic.
registrationSchema.index({ event: 1, student: 1 }, { unique: true }); 

export default mongoose.model("Registration", registrationSchema);