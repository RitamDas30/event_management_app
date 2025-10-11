// src/controllers/registration.controller.js
import Event from "../models/event.model.js";
import Registration from "../models/registration.model.js";
import QRCode from "qrcode";
// 🟢 REQUIRED: Import the socket getter for real-time updates
import { getIO } from "../config/socket.js"; 

// =========================================================
// 1. REGISTER FOR EVENT
// =========================================================
export const registerForEvent = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { eventId } = req.params; // Using destructuring from new code
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        // Using concise duplicate check from new code (status: { $ne: "cancelled" })
        const alreadyRegistered = await Registration.findOne({
            student: studentId,
            event: eventId,
            status: { $ne: "cancelled" },
        });

        // Combined logic for clearer error message:
        if (alreadyRegistered) {
            const statusMessage = alreadyRegistered.status === 'waitlisted' ? "waitlisted" : "registered";
            return res.status(400).json({ message: `Already ${statusMessage} for this event` });
        }
            
        let status = "registered";
        if (event.seatsAvailable <= 0) {
            status = "waitlisted";
        } else {
            // Consume a seat and save event only if status is 'registered'
            event.seatsAvailable -= 1;
            await event.save();
        }

        // Generate QR code data (using the more readable data structure)
        
// OLD: 
// const qrData = `Event: ${event.title}\nStudentID: ${studentId}\nEventID: ${eventId}\nStatus: ${status}`;
// 🟢 NEW: Use only IDs for minimum size and robust scanning
        const qrData = `event_id:${eventId}|student_id:${studentId}`;
        // Use .catch(() => null) for robustness
        const qrCode = await QRCode.toDataURL(qrData).catch(() => null); 

        const registration = await Registration.create({
            event: eventId,
            student: studentId,
            status,
            qrCode,
        });

        // 🟢 RESTORED: SOCKET EMIT LOGIC 
        try {
            const io = getIO();
            const totalRegistered = await Registration.countDocuments({ event: eventId, status: "registered" });

            io.emit("eventUpdated", {
                eventId: eventId.toString(),
                seatsAvailable: event.seatsAvailable,
                totalRegistered,
            });
            
            io.emit("registrationCreated", {
                registrationId: registration._id.toString(),
                eventId: eventId.toString(),
                studentId,
                status,
            });
        } catch (sockErr) {
            console.warn("Socket.io not initialized — skipping emit");
        }
        // 🟢 END SOCKET EMIT LOGIC 

        // Restored: Response message clarity (Registered vs. Waitlisted)
        const message = status === "registered" ? "Registered successfully" : "Waitlisted";
        return res.status(201).json({ message, registration });
    } catch (err) {
        console.error("registerForEvent error:", err);
        res.status(500).json({ message: "Failed to register for event" });
    }
};

// =========================================================
// 2. CANCEL REGISTRATION (UNCHANGED and CORRECT)
// =========================================================
export const cancelRegistration = async (req, res) => {
    try {
        const studentId = req.user.id;
        const eventId = req.params.eventId;

        const registration = await Registration.findOne({ event: eventId, student: studentId });
        if (!registration) return res.status(404).json({ message: "Registration not found" });

        if (registration.status === "cancelled") {
             return res.status(400).json({ message: "Registration is already cancelled" });
        }
        
        const event = await Event.findById(eventId);
        let promotedRegistration = null;

        if (registration.status === "registered") {
            event.seatsAvailable = Math.min(event.capacity, event.seatsAvailable + 1);
            
            promotedRegistration = await Registration.findOneAndUpdate(
                { event: eventId, status: "waitlisted" },
                { status: "registered" },
                { sort: { createdAt: 1 }, new: true }
            );

            if (promotedRegistration) {
                event.seatsAvailable = Math.max(0, event.seatsAvailable - 1);
                
                try {
                    const io = getIO();
                    io.emit("promotion", { eventId: eventId.toString(), promotedRegistrationId: promotedRegistration._id.toString(), studentId: promotedRegistration.student.toString() });
                } catch (e) {
                    console.warn("Socket not ready (promotion emit skipped)");
                }
            }
            await event.save(); 
        }

        registration.status = "cancelled";
        await registration.save(); 

        try {
            const io = getIO();
            const seatsAvailable = event ? event.seatsAvailable : null; 
            const totalRegistered = await Registration.countDocuments({ event: eventId, status: "registered" });

            io.emit("eventUpdated", {
                eventId: eventId.toString(),
                seatsAvailable: seatsAvailable,
                totalRegistered,
                cancelledRegistrationId: registration._id.toString() 
            });
        } catch (sockErr) {
            console.warn("Socket.io not initialized — skipping emit");
        }

        return res.json({ message: "Registration cancelled" });
    } catch (err) {
        console.error("cancelRegistration error:", err);
        res.status(500).json({ message: "Cancel failed" });
    }
};

// =========================================================
// 3. GET MY REGISTRATIONS (UNCHANGED and CORRECT)
// =========================================================
export const getMyRegistrations = async (req, res) => {
    try {
        const studentId = req.user.id; 
        console.log(`registration.controller.js : ${studentId}`)
        const registrations = await Registration.find({ student: studentId })
            .populate('event')
            .sort({ createdAt: -1 });
        // 🛑 ADD THESE HEADERS TO DISABLE CACHING
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        // 🛑 END CACHING HEADERS


        return res.status(200).json(registrations);
    } catch (err) {
        console.error("getMyRegistrations error:", err);
        res.status(500).json({ message: "Failed to fetch registrations" });
    }
};