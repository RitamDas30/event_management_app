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
  fullAddress: {
        type: String,
        required: true, 
    },
    venueName: {
        type: String,
        required: true, 
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
      // Validator to ensure seatsAvailable never exceeds capacity
      validate: {
        validator: function(v) {
          return v <= this.capacity;
        },
        message: props => `${props.value} must not exceed the event capacity (${props.instance.capacity})`
      }
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


eventSchema.index({ category: 1, venue: 1 });
// Added a separate text index for full-text searching
eventSchema.index({ title: "text", description: "text" });

export default mongoose.model("Event", eventSchema);
