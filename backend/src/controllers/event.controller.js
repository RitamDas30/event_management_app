import Event from "../models/event.model.js";

// ➕ Create a new event (organizer only)
export const createEvent = async (req, res) => {
  try {
    const { title, description, category, venue, startTime, endTime, capacity, price } = req.body;
    
    // Cloudinary URL/Path from Multer
    const imagePath = req.file ? req.file.path : null; 
    
    // Set initial seatsAvailable and isPaid
    const isPaid = price > 0;
    const seatsAvailable = capacity; 

    const event = await Event.create({
      title,
      description,
      category,
      venue,
      startTime,
      endTime,
      capacity,
      price,
      seatsAvailable: seatsAvailable, 
      imageUrl: imagePath,
      isPaid: isPaid, 
      organizer: req.user.id, 
    });

    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    console.error("Create Event Error:", error);
    // Note: The specific error message is hidden for security in production
    res.status(500).json({ message: "Failed to create event" }); 
  }
};

// ---------------------------------------------------------
// Get all events (with optional filters)
// ---------------------------------------------------------
export const getEvents = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    
    if (search) filter.title = { $regex: search, $options: "i" };

    const events = await Event.find(filter).populate("organizer", "name email role");
    res.json(events);
  } catch (error) {
    console.error("Get Events Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// Get a single event

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


// Update event (Organizer or Admin)

export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 1. ADMIN/ORGANIZER Authorization Check
    const isOrganizer = event.organizer.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized: You are not the event organizer or an administrator." });
    }
    
    // Handle image update via Multer/Cloudinary (if included)
    if (req.file) {
        req.body.imageUrl = req.file.path; 
    }

    // 2. CRITICAL LOGIC: Handle Capacity Change
    if (req.body.capacity) {
        const oldCapacity = event.capacity;
        const newCapacity = req.body.capacity;
        const occupiedSeats = oldCapacity - event.seatsAvailable;

        if (newCapacity < occupiedSeats) {
            return res.status(400).json({ message: "New capacity cannot be less than the number of booked seats." });
        }
        
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
//  Delete event (Organizer or Admin)
// ---------------------------------------------------------
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // 1. ADMIN/ORGANIZER Authorization Check
    const isOrganizer = event.organizer.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized: You are not the event organizer or an administrator." });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ message: error.message });
  }
};