import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      maxlength: 2000,
    },
    category: {
      type: String,
      enum: [
        "Technical",
        "Cultural",
        "Sports",
        "Academic",
        "Social",
      ],
      required: [true, "Event category is required"],
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organizer reference is required"],
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    seatsAvailable: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      default: 0, // 0 = free event
    },
    imageUrl: {
      type: String,
      default: "",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
  },
  { timestamps: true }
);

// 📊 Index for search/filter performance
eventSchema.index({ title: "text", category: 1, venue: 1 });

export default mongoose.model("Event", eventSchema);
