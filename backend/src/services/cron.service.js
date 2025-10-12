import cron from 'node-cron';
import { startOfDay, endOfDay } from 'date-fns';
import Registration from '../models/registration.model.js'; // Assuming model path
import mongoose from 'mongoose'; 
// 🛑 FIX 1: Correctly import the unified function name
import { sendEventEmail } from './email.service.js'; 

// Helper to check if Mongoose is connected before running DB query
const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Runs a daily check for events starting tomorrow and sends a reminder email with the QR code.
 */
const runEventReminderJob = async () => {
    if (!isDbConnected()) {
        console.warn('[Cron Service] DB not connected. Skipping reminder job.');
        return;
    }
    
    console.log('--- Running daily event reminder check ---');
    
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1); // Sets the date to tomorrow

        // Define the time window: all of tomorrow
        const tomorrowStart = startOfDay(tomorrow);
        const tomorrowEnd = endOfDay(tomorrow);

        // Find registered students for events happening tomorrow
        const registrations = await Registration.find({
            status: 'registered',
            // NOTE: Mongoose filter on populated field is imperfect. We rely on the 
            // post-query filter (relevantRegistrations) for precision.
        })
        .populate({
            path: 'student',
            select: 'email' 
        })
        .populate({
            path: 'event',
            select: 'title startTime venue' 
        });

        // Secondary filter: Only keep registrations for events starting tomorrow
        const relevantRegistrations = registrations.filter(reg => 
            reg.event && reg.student && 
            new Date(reg.event.startTime) >= tomorrowStart && 
            new Date(reg.event.startTime) < tomorrowEnd
        );


        if (relevantRegistrations.length === 0) {
            console.log('[Cron Service] No events scheduled for tomorrow.');
            return;
        }

        console.log(`[Cron Service] Found ${relevantRegistrations.length} reminders to send.`);

        for (const reg of relevantRegistrations) {
            if (reg.student && reg.event) {
                // 🛑 FIX 2: Use the new function name and set isReminder=true
                await sendEventEmail(reg.student.email, {
                    eventName: reg.event.title,
                    eventTime: reg.event.startTime,
                    venue: reg.event.venue,
                    status: reg.status, // ⬅️ Required by sendEventEmail
                    qrCodeBase64: reg.qrCode,
                }, true); // ⬅️ isReminder flag
            }
        }
        
    } catch (error) {
        console.error('[Cron Service] CRON JOB ERROR:', error);
    }
};

/**
 * Initializes and starts the cron job scheduler.
 * Runs every day at 00:00 (midnight).
 */
export const startCronJobs = () => {
    // Cron expression: minute hour day-of-month month day-of-week
    cron.schedule('0 0 * * *', runEventReminderJob, {
        timezone: "Asia/Kolkata" // Use a static timezone for reliable scheduling
    });
    console.log('[Cron Service] Daily reminder job scheduled.');
    
    // Optional: Run once immediately after startup for testing purposes
    // runEventReminderJob();
};
