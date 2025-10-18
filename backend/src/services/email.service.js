import nodemailer from 'nodemailer';

// ✅ Lazy initialization - transporter created only when needed (after dotenv loads)
let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        const port = parseInt(process.env.EMAIL_PORT);
        
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: port,
            secure: port === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            requireTLS: port === 587,
            timeout: 10000,
            tls: {
                rejectUnauthorized: false,
            }
        });
        
        console.log(`[Email Service] Transporter initialized (Host: ${process.env.EMAIL_HOST}, Port: ${port})`);
    }
    return transporter;
};

/**
 * Sends an email for various event scenarios
 * @param {string} toEmail - Recipient email
 * @param {object} data - Email data (eventName, qrCodeBase64, resetUrl, etc.)
 * @param {string} type - Email type: 'confirmation', 'reminder', 'promotion', 'cancellation', 'reset'
 */
export const sendEventEmail = async (toEmail, data, type = 'confirmation') => {
    
    const isReset = type === 'reset';
    const isReminder = type === 'reminder';
    const isPromotion = type === 'promotion';
    const isCancellation = type === 'cancellation';

    // --- 1. Construct Subject and Title ---
    let emailSubject;
    if (isReset) {
        emailSubject = `🔑 Password Reset Request for Smart Campus`;
    } else if (isCancellation) {
        emailSubject = `❌ IMPORTANT: Event Canceled - ${data.eventName}`;
    } else if (isReminder) {
        emailSubject = `⏰ REMINDER: Your Ticket for ${data.eventName} is Tomorrow!`;
    } else if (isPromotion) {
        emailSubject = `🎉 PROMOTION: You're Registered for ${data.eventName}!`;
    } else {
        emailSubject = `✅ CONFIRMATION: You are Registered for ${data.eventName}`;
    }
    
    const headerTitle = isReset ? 'Password Reset Required' 
                      : isCancellation ? 'Event Cancellation Notice'
                      : isReminder ? '24hr Event Reminder'
                      : isPromotion ? 'Waitlist Promotion'
                      : 'Registration Confirmed';

    // --- 2. Validation ---
    if (!isReset && !isCancellation && !data.qrCodeBase64) {
        console.warn(`[Email Service] Skipping email for ${toEmail}: Missing QR code.`);
        return;
    }

    // --- 3. Build HTML Body ---
    let htmlBody;

    if (isReset) {
        htmlBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #f59e0b;">Password Reset Required</h2>
                <p>We received a password reset request for your account associated with ${toEmail}.</p>
                <p style="margin-top: 15px;">Please click the secure link below to set a new password. This link is only valid for <strong>1 hour</strong>.</p>
                <p style="margin-top: 20px; text-align: center;">
                    <a href="${data.resetUrl}" 
                       style="background-color: #1e40af; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                       Reset Your Password
                    </a>
                </p>
                <p style="margin-top: 30px; font-size: 0.9em; color: #6b7280;">
                    If you did not request a password reset, you can safely ignore this email.
                </p>
            </div>
        `;
    } else if (isCancellation) {
        htmlBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #EF4444;">Event Cancellation Notice</h2>
                <p>We regret to inform you that the event <strong>${data.eventName}</strong>, which you were registered for, has been <strong>canceled permanently</strong>.</p>
                <h3 style="color: #EF4444; margin-top: 25px;">Reason Provided by Organizer</h3>
                <p style="margin-top: 5px; padding: 10px; border-left: 3px solid #EF4444; background-color: #FEF2F2;">
                    ${data.cancellationReason || 'No specific reason was provided.'}
                </p>
                <p style="margin-top: 25px; font-size: 0.9em; color: #6b7280;">
                    Your seat has been automatically voided. We apologize for any inconvenience.
                </p>
            </div>
        `;
    } else if (isPromotion) {
        htmlBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2563EB;">🎉 Congratulations! You've Been Promoted</h2>
                <p>Great news! A seat has opened up for <strong>${data.eventName}</strong>, and you have been moved from the <strong>WAITLIST</strong> to <strong>REGISTERED</strong> status.</p>
                <p style="margin-top: 15px;"><strong>Event:</strong> ${data.eventName}</p>
                <p><strong>Venue:</strong> ${data.venue}</p>
                <p><strong>Time:</strong> ${new Date(data.eventTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                <h3 style="color: #1e40af; margin-top: 25px;">Your Digital Ticket</h3>
                <p>Please present the QR code at the entrance.</p>
                <img src="cid:qrcode" alt="Event QR Code Ticket" 
                     style="display: block; width: 200px; height: 200px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 8px;" />
                <p style="margin-top: 25px; font-size: 0.85em; color: #6b7280;">We look forward to seeing you there!</p>
            </div>
        `;
    } else {
        // Confirmation or Reminder
        htmlBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: ${isReminder ? '#f59e0b' : '#10b981'};">${headerTitle}</h2>
                <p>${isReminder ? 'This is a friendly reminder that your event starts tomorrow.' : 'Thank you for registering!'} Below are your event details.</p>
                <p style="margin-top: 15px;"><strong>Event:</strong> ${data.eventName}</p>
                <p><strong>Status:</strong> ${data.status}</p>
                <p><strong>Venue:</strong> ${data.venue}</p>
                <p><strong>Time:</strong> ${new Date(data.eventTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
                <h3 style="color: #1e40af; margin-top: 25px;">Your Digital Ticket</h3>
                <p>Please use this QR code at the entrance for quick check-in.</p>
                <img src="cid:qrcode" alt="Event QR Code Ticket" 
                     style="display: block; width: 200px; height: 200px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 8px;" />
                <p style="margin-top: 25px; font-size: 0.85em; color: #6b7280;">We look forward to seeing you there!</p>
            </div>
        `;
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: emailSubject,
            html: htmlBody,
        };

        // --- 4. Add QR Code as CID Attachment (for non-reset, non-cancellation emails) ---
        if (!isReset && !isCancellation && data.qrCodeBase64) {
            const base64Data = data.qrCodeBase64.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            mailOptions.attachments = [{
                filename: 'qrcode.png',
                content: imageBuffer,
                cid: 'qrcode'
            }];
        }

        // ✅ Get transporter only when sending (after dotenv loaded)
        const emailTransporter = getTransporter();
        await emailTransporter.sendMail(mailOptions);
        
        console.log(`[Email Service] ✅ ${headerTitle} sent successfully to ${toEmail}`);

    } catch (error) {
        console.error(`[Email Service] ❌ Failed to send ${type} email to ${toEmail}:`, error.message);
        throw error;
    }
};