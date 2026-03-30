import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 1000,
      default: "",
    },
  },
  { timestamps: true }
);

// One review per user per event
reviewSchema.index({ event: 1, user: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
