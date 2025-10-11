// src/controllers/event.controller.js
import Event from "../models/event.model.js";

// ➕ Create a new event (organizer only)
export const createEvent = async (req, res) => {
  try {
    // Note: imageUrl is no longer in req.body, as it comes from the file upload
    const { title, description, category, venue, startTime, endTime, capacity, price } = req.body;

    // 1. Handle Image Path from Multer (using the path logic from the suggestion)
    // The path is saved as /uploads/filename for public access later.
  // OLD LOGIC (Disk Storage):
// const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

// 🟢 NEW LOGIC (Cloudinary):
// req.file.path or req.file.secure_url contains the full hosted URL
const imagePath = req.file ? req.file.path : null; 
// OR: const imagePath = req.file ? req.file.secure_url : null;
// Use req.file.path as that is generally the standard URL returned by multer-storage-cloudinary
    
    // 2. 🟢 RESTORED LOGIC: Set initial seatsAvailable and isPaid
    const isPaid = price > 0;
    const seatsAvailable = capacity; // Seats available must equal capacity on creation

    const event = await Event.create({
      title,
      description,
      category,
      venue,
      startTime,
      endTime,
      capacity,
      price,
      // 🟢 RESTORED: Default seatsAvailable = capacity
      seatsAvailable: seatsAvailable, 
      // 🟢 NEW: Use the path from Multer for imageUrl
      imageUrl: imagePath,
      // 🟢 RESTORED: Calculate isPaid based on price
      isPaid: isPaid, 
      // Organizer ID from JWT
      organizer: req.user.id, 
    });

    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Failed to create event" });
  }
};

// ---------------------------------------------------------
// 📋 Get all events (with optional filters)
// ---------------------------------------------------------
export const getEvents = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
      
    // Using $regex for partial title search (case-insensitive)
    if (search) filter.title = { $regex: search, $options: "i" };

    const events = await Event.find(filter).populate("organizer", "name email role");
    res.json(events);
  } catch (error) {
    console.error("Get Events Error:", error);
    res.status(500).json({ message: error.message });
  }
};



// ---------------------------------------------------------
// 🔍 Get a single event
// ---------------------------------------------------------
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email role");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    console.error("Get Event By ID Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------
// ✏️ Update event (organizer or admin)
// ---------------------------------------------------------
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 1. Authorization Check (already correct)
    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: You are not the organizer or an admin." });
    }
    
    // 🟢 NEW: Handle image update via Multer (if included)
    // NOTE: If you integrate this file upload middleware to the PUT route, this is needed.
    if (req.file) {
        req.body.imageUrl = `/uploads/${req.file.filename}`;
    }

    // 2. CRITICAL LOGIC: Handle Capacity Change
    if (req.body.capacity) {
        const oldCapacity = event.capacity;
        const newCapacity = req.body.capacity;
        const occupiedSeats = oldCapacity - event.seatsAvailable;

        // Ensure new capacity is not less than the currently occupied seats
        if (newCapacity < occupiedSeats) {
            return res.status(400).json({ message: "New capacity cannot be less than the number of booked seats." });
        }
        
        // Adjust seatsAvailable based on the change in capacity
        const capacityDifference = newCapacity - oldCapacity;
        req.body.seatsAvailable = event.seatsAvailable + capacityDifference;
    }

    // 3. Update fields and save
    Object.assign(event, req.body);
    
    // Re-calculate isPaid if price is modified
    if (req.body.price !== undefined) {
        event.isPaid = event.price > 0;
    }
    
    await event.save();

    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------
// ❌ Delete event
// ---------------------------------------------------------
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization Check
    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized: You are not the organizer or an admin." });
    }

    // Use findByIdAndDelete for cleaner execution
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};