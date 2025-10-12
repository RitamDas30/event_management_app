import Event from "../models/event.model.js";
import Registration from "../models/registration.model.js";
import QRCode from "qrcode";
import { getIO } from "../config/socket.js"; 
import { sendEventEmail } from '../services/email.service.js';
import mongoose from 'mongoose'; 

// Get the User model to fetch email addresses
const UserModel = mongoose.model('User'); 


// =========================================================
// 1. REGISTER FOR EVENT (WITH 15-MINUTE BAN CHECK)
// =========================================================
export const registerForEvent = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { eventId } = req.params; 

        // 1. Fetch Event Details (Required for conflict check)
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const eventStartTime = event.startTime;
        const eventEndTime = event.endTime;


        // 2. CHECK FOR PREVIOUS REGISTRATION (Registered, Waitlisted, OR Cancelled)
        const alreadyRegistered = await Registration.findOne({
            student: studentId,
            event: eventId,
            status: { $in: ["registered", "waitlisted", "cancelled"] }, // Check for ANY previous status
        });

        // 🟢 NEW BAN CHECK LOGIC
        if (alreadyRegistered.cancelledAt) {
            const timeSinceCancellation = Date.now() - new Date(alreadyRegistered.cancelledAt).getTime();
            const banDurationMs = 15 * 60 * 1000; // 15 minutes in milliseconds

            if (timeSinceCancellation < banDurationMs) {
                // Ban is ACTIVE
                const remainingTimeMs = banDurationMs - timeSinceCancellation;
                const minutes = Math.ceil(remainingTimeMs / (60 * 1000));
                
                return res.status(403).json({ 
                    message: `You must wait ${minutes} minutes before re-registering for this event due to a recent cancellation.`,
                    banned: true // Send a flag for frontend UI
                });
            }
            // If the ban time has passed, delete the cancelled registration to allow re-registration
            await Registration.deleteOne({ _id: alreadyRegistered._id });
        } 
        else if (alreadyRegistered) {
            // Handles active/waitlisted check (status is registered or waitlisted)
            const statusMessage = alreadyRegistered.status === 'waitlisted' ? "waitlisted" : "registered";
            return res.status(400).json({ message: `Already ${statusMessage} for this event` });
        }
        // 🟢 END BAN CHECK LOGIC

        
        // 3. CHECK FOR SCHEDULE CONFLICT (CRITICAL FEATURE)
        const conflict = await Registration.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(studentId),
                    status: 'registered',
                },
            },
            {
                $lookup: {
                    from: 'events', 
                    localField: 'event',
                    foreignField: '_id',
                    as: 'registeredEvent',
                },
            },
            { $unwind: '$registeredEvent' },
            {
                $match: {
                    // Overlap logic: New Event Start < Existing Event End AND New Event End > Existing Event Start
                    $and: [
                        { 'registeredEvent.endTime': { $gt: eventStartTime } },
                        { 'registeredEvent.startTime': { $lt: eventEndTime } },
                    ],
                },
            },
        ]);

        if (conflict.length > 0) {
             // Return a specific conflict error message (409 Conflict)
             const conflictingEventTitle = conflict[0].registeredEvent.title;
             return res.status(409).json({ 
                message: `Schedule conflict: This event overlaps with your registration for "${conflictingEventTitle}".`,
                conflict: true
             });
        }
        
        // 4. Handle Seat Availability (Registration logic proceeds if no conflict)
        let status = "registered";
        if (event.seatsAvailable <= 0) {
            status = "waitlisted";
        } else {
            event.seatsAvailable -= 1;
            await event.save();
        }

        // Generate QR code
        const qrData = `event_id:${eventId}|student_id:${studentId}`;
        const qrCode = await QRCode.toDataURL(qrData).catch(() => null); 

        const registration = await Registration.create({
            event: eventId,
            student: studentId,
            status,
            qrCode,
        });


        // 5. FETCH STUDENT EMAIL AND SEND IMMEDIATE CONFIRMATION
        try {
            // 1. Fetch the student's email address by studentId
            const student = await UserModel.findById(studentId).select('email'); 
            
            if (student && student.email) {
                // 2. Send the confirmation email (type='confirmation')
                await sendEventEmail(student.email, {
                    eventName: event.title, eventTime: event.startTime, venue: event.venue,
                    status: registration.status, qrCodeBase64: registration.qrCode,
                }, 'confirmation'); 
            }

        } catch (emailError) {
            // Log email errors but do not block the HTTP response
            console.error("Failed to send confirmation email (non-fatal):", emailError.message); 
        }

        // 6. Socket Emit and Response
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


        const message = status === "registered" ? "Registered successfully" : "Waitlisted";
        return res.status(201).json({ message, registration });
        
    } catch (err) {
        console.error("registerForEvent error:", err);
        res.status(500).json({ message: "Registration failed: " + err.message });
    }
};

// =========================================================
// 2. CANCEL REGISTRATION (Waitlist Promotion Logic)
// =========================================================
export const cancelRegistration = async (req, res) => {
    try {
        const studentId = req.user.id;
        const eventId = req.params.eventId;
        // 🛑 NEW: Capture reason from the request body (sent by the modal)
        const { reason, otherDetails } = req.body; 

        const registration = await Registration.findOne({ event: eventId, student: studentId });
        if (!registration) return res.status(404).json({ message: "Registration not found" });

        if (registration.status === "cancelled") {
             return res.status(400).json({ message: "Registration is already cancelled" });
        }
        
        const event = await Event.findById(eventId);
        let promotedRegistration = null;

        // 1. If user was REGISTERED, execute the promotion logic
        if (registration.status === "registered") {
            
            // a) Free up a seat
            event.seatsAvailable = Math.min(event.capacity, event.seatsAvailable + 1);
            
            // b) Find the earliest waitlisted user AND promote them
            promotedRegistration = await Registration.findOneAndUpdate(
                { event: eventId, status: "waitlisted" },
                { status: "registered" },
                { sort: { createdAt: 1 }, new: true } 
            ).populate('student', 'email').populate('event', 'title startTime venue'); // Populate student/event for email

            if (promotedRegistration) {
                // c) Seat occupied by promoted user, reduce available seats
                event.seatsAvailable = Math.max(0, event.seatsAvailable - 1);

                // d) SEND PROMOTION EMAIL
                if (promotedRegistration.student && promotedRegistration.event) {
                    await sendEventEmail(promotedRegistration.student.email, {
                        eventName: promotedRegistration.event.title,
                        eventTime: promotedRegistration.event.startTime,
                        venue: promotedRegistration.event.venue,
                        status: 'registered',
                        qrCodeBase64: promotedRegistration.qrCode,
                    }, 'promotion'); // Use the 'promotion' type
                }
                
                // e) Emit promotion via Socket.io
                try {
                    const io = getIO();
                    io.emit("promotion", { 
                        eventId: eventId.toString(), 
                        promotedRegistrationId: promotedRegistration._id.toString(), 
                        studentId: promotedRegistration.student._id.toString() 
                    });
                } catch (e) {
                    console.warn("Socket not ready (promotion emit skipped)");
                }
            }
            
            // Save all changes to the Event document (seat count finalized)
            await event.save(); 
        }
        
        // 2. Mark original registration as cancelled and save reason (NEW)
        registration.status = "cancelled";
        // 🛑 Set the ban timestamp to the moment of cancellation
        registration.cancelledAt = new Date(); 
        registration.cancellationReason = reason;
        registration.cancellationDetails = otherDetails; 
        await registration.save(); 

        // 3. Emit event update
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

        // 4. Success Response (with optional details of promotion)
        const responseMessage = promotedRegistration 
            ? `Registration cancelled. ${promotedRegistration.student.email} was promoted from the waitlist.`
            : `Registration cancelled. Seat added back to available count.`;
        
        // 🟢 ADD BAN WARNING TO THE RESPONSE MESSAGE
        const banMessage = ` You are now restricted from re-registering for this event for 15 minutes.`;

        return res.json({ message: responseMessage + banMessage });
        
    } catch (err) {
        console.error("cancelRegistration error:", err);
        return res.status(500).json({ message: "Cancellation failed: " + err.message });
    }
};

// =========================================================
// 3. GET MY REGISTRATIONS
// =========================================================
export const getMyRegistrations = async (req, res) => {
    try {
        const studentId = req.user.id; 
        const registrations = await Registration.find({ student: studentId })
            .populate('event')
            .sort({ createdAt: -1 });
        // Caching headers remain for safe API usage
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');


        return res.status(200).json(registrations);
    } catch (err) {
        console.error("getMyRegistrations error:", err);
        res.status(500).json({ message: "Failed to fetch registrations" });
    }
};