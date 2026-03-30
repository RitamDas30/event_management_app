import Event from "../models/event.model.js";
import Registration from "../models/registration.model.js";
import { sendEventEmail } from '../services/email.service.js';
import logger from "../config/logger.js";

// Create a new event (organizer only)
export const createEvent = async (req, res) => {
  try {
    const { title, description, category, fullAddress, venueName, startTime, endTime, capacity, price } = req.body;

    const imagePath = req.file ? req.file.path : null;
    const isPaid = price > 0;
    const seatsAvailable = capacity;

    // Parse JSON array fields from FormData
    let tags = [];
    let agenda = [];
    let faqs = [];
    let speakers = [];

    try {
      if (req.body.tags) tags = JSON.parse(req.body.tags);
      if (req.body.agenda) agenda = JSON.parse(req.body.agenda);
      if (req.body.faqs) faqs = JSON.parse(req.body.faqs);
      if (req.body.speakers) speakers = JSON.parse(req.body.speakers);
    } catch (parseErr) {
      logger.warn({ err: parseErr }, "Failed to parse JSON fields, using defaults");
    }

    const event = await Event.create({
      title,
      description,
      category,
      fullAddress,
      venueName,
      startTime,
      endTime,
      capacity,
      price,
      seatsAvailable: seatsAvailable,
      imageUrl: imagePath,
      isPaid: isPaid,
      organizer: req.user.id,
      tags,
      agenda,
      faqs,
      speakers,
      eventMode: req.body.eventMode || "in-person",
      streamConfig: {
        roomId: req.body.eventMode !== "in-person" ? `evently-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : "",
      },
    });

    res.status(201).json({ message: "Event created successfully", event });
  } catch (error) {
    logger.error({ err: error }, "Create event error");
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
    logger.error({ err: error }, "Get events error");
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------
// Get a single event
// ---------------------------------------------------------
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate("organizer", "name email role");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    logger.error({ err: error }, "Get event by ID error");
    res.status(500).json({ message: error.message });
  }
};

// ---------------------------------------------------------
// Update event (Organizer or Admin)
// ---------------------------------------------------------
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
    const newCapacityValue = req.body.capacity;
    
    if (newCapacityValue !== undefined && newCapacityValue !== null) { 
        const newCapacity = Number(newCapacityValue); 
        
        if (isNaN(newCapacity) || newCapacity < 0) {
             return res.status(400).json({ message: "Capacity must be a non-negative number." });
        }
        
        const oldCapacity = event.capacity;
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
    logger.error({ err: error }, "Update event error"); 
    
    let errorMessage = "Event update failed.";
    
    if (error.name === 'ValidationError') {
        errorMessage = Object.values(error.errors).map(val => val.message).join('; ');
        return res.status(400).json({ message: `Validation Error: ${errorMessage}` }); 
    } else {
        errorMessage = error.message;
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// ---------------------------------------------------------
// ❌ Delete event (Organizer or Admin) - ENHANCED VERSION
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

    // 🟢 NEW: Capture deletion reason from the request body
    const { reason, otherDetails } = req.body;
    const finalReason = reason === 'Other' ? otherDetails : reason; 
    
    // 2. 🟢 NOTIFY ALL REGISTERED STUDENTS (CRITICAL)
    const registeredAttendees = await Registration.find({
        event: req.params.id,
        status: 'registered' 
    }).populate('student', 'email');
    
    if (registeredAttendees.length > 0) {
        logger.info({ count: registeredAttendees.length, eventId: req.params.id }, "Notifying attendees about cancellation");
        
        // Send email concurrently to all registered students
        const emailPromises = registeredAttendees.map(async (reg) => {
            if (reg.student && reg.student.email) {
                try {
                    await sendEventEmail(reg.student.email, {
                        eventName: event.title,
                        cancellationReason: finalReason || 'No reason provided',
                        eventTime: event.startTime,
                        venue: event.venueName,
                    }, 'cancellation');
                } catch (emailError) {
                    logger.error({ err: emailError, email: reg.student.email }, "Failed to send cancellation email");
                }
            }
        });
        
        await Promise.all(emailPromises);
    }
    
    // 3. Delete event and all related registration records
    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ event: req.params.id });
    
    res.json({ 
        message: `Event '${event.title}' and all ${registeredAttendees.length} registrations were successfully cancelled and deleted.` 
    });
  } catch (error) {
    logger.error({ err: error }, "Delete event error");
    res.status(500).json({ message: "Event deletion failed: " + error.message });
  }
};