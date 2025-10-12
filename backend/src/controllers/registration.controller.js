import Event from "../models/event.model.js";
import Registration from "../models/registration.model.js";
import QRCode from "qrcode";
import { getIO } from "../config/socket.js"; 
import { sendEventEmail } from '../services/email.service.js';
import mongoose from 'mongoose'; 

const UserModel = mongoose.model('User'); 

// =========================================================
// 1. REGISTER FOR EVENT (WITH 15-MINUTE BAN CHECK - FIXED)
// =========================================================
export const registerForEvent = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { eventId } = req.params; 

        // 1. Fetch Event Details
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const eventStartTime = event.startTime;
        const eventEndTime = event.endTime;

        // 2. CHECK FOR PREVIOUS REGISTRATION
        const alreadyRegistered = await Registration.findOne({
            student: studentId,
            event: eventId,
            status: { $in: ["registered", "waitlisted", "cancelled"] },
        });

        // 🟢 FIXED BAN CHECK LOGIC - Added null check
        if (alreadyRegistered && alreadyRegistered.status === 'cancelled') {
            
            // Check if cancelledAt exists
            if (alreadyRegistered.cancelledAt) {
                const timeSinceCancellation = Date.now() - new Date(alreadyRegistered.cancelledAt).getTime();
                const banDurationMs = 15 * 60 * 1000; // 15 minutes

                if (timeSinceCancellation < banDurationMs) {
                    // Ban is ACTIVE
                    const remainingTimeMs = banDurationMs - timeSinceCancellation;
                    const minutes = Math.ceil(remainingTimeMs / (60 * 1000));
                    
                    console.log(`[BAN ACTIVE] User ${studentId} blocked from event ${eventId}. ${minutes} min remaining.`);
                    
                    return res.status(403).json({ 
                        message: `You must wait ${minutes} minute(s) before re-registering for this event due to a recent cancellation.`,
                        banned: true,
                        remainingMinutes: minutes
                    });
                }
            }
            
            // Ban expired or no cancelledAt - allow re-registration
            console.log(`[BAN EXPIRED] User ${studentId} can now re-register for event ${eventId}.`);
            await Registration.deleteOne({ _id: alreadyRegistered._id });
        } 
        else if (alreadyRegistered) {
            // Already registered or waitlisted
            const statusMessage = alreadyRegistered.status === 'waitlisted' ? "waitlisted" : "registered";
            return res.status(400).json({ message: `Already ${statusMessage} for this event` });
        }

        // 3. CHECK FOR SCHEDULE CONFLICT
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
                    $and: [
                        { 'registeredEvent.endTime': { $gt: eventStartTime } },
                        { 'registeredEvent.startTime': { $lt: eventEndTime } },
                    ],
                },
            },
        ]);

        if (conflict.length > 0) {
             const conflictingEventTitle = conflict[0].registeredEvent.title;
             return res.status(409).json({ 
                message: `Schedule conflict: This event overlaps with your registration for "${conflictingEventTitle}".`,
                conflict: true
             });
        }
        
        // 4. Handle Seat Availability
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

        // 5. SEND CONFIRMATION EMAIL
        try {
            const student = await UserModel.findById(studentId).select('email'); 
            
            if (student && student.email) {
                await sendEventEmail(student.email, {
                    eventName: event.title, 
                    eventTime: event.startTime, 
                    venue: event.venue,
                    status: registration.status, 
                    qrCodeBase64: registration.qrCode,
                }, 'confirmation'); 
            }
        } catch (emailError) {
            console.error("Failed to send confirmation email (non-fatal):", emailError.message); 
        }

        // 6. Socket Emit
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
        const { reason, otherDetails } = req.body; 

        const registration = await Registration.findOne({ event: eventId, student: studentId });
        if (!registration) return res.status(404).json({ message: "Registration not found" });

        if (registration.status === "cancelled") {
             return res.status(400).json({ message: "Registration is already cancelled" });
        }
        
        const event = await Event.findById(eventId);
        let promotedRegistration = null;

        // 1. If user was REGISTERED, execute promotion logic
        if (registration.status === "registered") {
            
            event.seatsAvailable = Math.min(event.capacity, event.seatsAvailable + 1);
            
            promotedRegistration = await Registration.findOneAndUpdate(
                { event: eventId, status: "waitlisted" },
                { status: "registered" },
                { sort: { createdAt: 1 }, new: true } 
            ).populate('student', 'email').populate('event', 'title startTime venue');

            if (promotedRegistration) {
                event.seatsAvailable = Math.max(0, event.seatsAvailable - 1);

                // Send promotion email
                try {
                    if (promotedRegistration.student && promotedRegistration.event) {
                        await sendEventEmail(promotedRegistration.student.email, {
                            eventName: promotedRegistration.event.title,
                            eventTime: promotedRegistration.event.startTime,
                            venue: promotedRegistration.event.venue,
                            status: 'registered',
                            qrCodeBase64: promotedRegistration.qrCode,
                        }, 'confirmation');
                    }
                } catch (emailErr) {
                    console.error("Failed to send promotion email:", emailErr.message);
                }
                
                // Emit promotion via Socket
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
            
            await event.save(); 
        }
        
        // 2. Mark as cancelled and SET THE BAN TIMESTAMP
        registration.status = "cancelled";
        registration.cancelledAt = new Date();
        registration.cancellationReason = reason;
        registration.cancellationDetails = otherDetails; 
        await registration.save(); 

        console.log(`[CANCELLATION] User ${studentId} cancelled event ${eventId}. Ban set until ${new Date(Date.now() + 15 * 60 * 1000).toLocaleTimeString()}`);

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

        const responseMessage = promotedRegistration 
            ? `Registration cancelled. ${promotedRegistration.student.email} was promoted from the waitlist.`
            : `Registration cancelled. Seat added back to available count.`;
        
        const banMessage = ` You are restricted from re-registering for this event for 15 minutes.`;

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
            
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        return res.status(200).json(registrations);
    } catch (err) {
        console.error("getMyRegistrations error:", err);
        res.status(500).json({ message: "Failed to fetch registrations" });
    }
};