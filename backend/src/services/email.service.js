import nodemailer from 'nodemailer';

// ✅ Don't create transporter at module load - create it when needed
let transporter = null;

/**
 * Gets or creates the email transporter (lazy initialization)
 */
const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            secure: parseInt(process.env.EMAIL_PORT) === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            }
        });
    }
    return transporter;
};

/**
 * Sends an email (Confirmation, Reminder, or Reset) with event details or a reset link.
 * @param {string} toEmail - The recipient's email address.
 * @param {object} data - Object containing email-specific data (eventName, qrCodeBase64, resetUrl, status, etc.).
 * @param {string} type - The type of email ('confirmation', 'reminder', or 'reset').
 */
export const sendEventEmail = async (toEmail, data, type = 'confirmation') => {
    
    // Determine email type flags
    const isReset = type === 'reset';
    const isReminder = type === 'reminder';

    // --- 1. Construct Subject and Title ---
    const emailSubject = isReset 
        ? `🔑 Password Reset Request for Smart Campus`
        : isReminder 
        ? `⏰ REMINDER: Your Ticket for ${data.eventName} is Tomorrow!`
        : `✅ CONFIRMATION: You are Registered for ${data.eventName}`;
        
    const headerTitle = isReset ? 'Password Reset Required' : isReminder ? '24hr Event Reminder' : 'Registration Confirmed';

    // --- 2. Validation ---
    if (!isReset && !data.qrCodeBase64) {
        console.warn(`[Email Service] Skipping non-reset email for ${toEmail}: Missing QR code data.`);
        return;
    }

    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: emailSubject,
            
            // --- 3. Conditional HTML Body ---
            html: isReset 
                ? // HTML for Password Reset Email
                `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #f59e0b;">Password Reset Required</h2>
                    <p>We received a password reset request for your account associated with ${toEmail}.</p>
                    
                    <p style="margin-top: 15px;">Please click the secure link below to set a new password. This link is only valid for **1 hour**.</p>
                    
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
            `
            : 
            // HTML for Event Confirmation / Reminder Email
            `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: ${isReminder ? '#f59e0b' : '#10b981'};">${headerTitle}</h2>
                    <p>${isReminder ? 'This is a friendly reminder that your event starts tomorrow.' : 'Thank you for registering!'} Below are your event details.</p>
                    
                    <p style="margin-top: 15px;"><strong>Event:</strong> ${data.eventName}</p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    <p><strong>Venue:</strong> ${data.venue}</p>
                    <p><strong>Time:</strong> ${new Date(data.eventTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>

                    <h3 style="color: #1e40af; margin-top: 25px;">Your Digital Ticket</h3>
                    <p>Please use this QR code at the entrance for quick check-in.</p>
                    
                    <img 
                        src="cid:qrcode" 
                        alt="Event QR Code Ticket" 
                        style="display: block; width: 200px; height: 200px; margin: 20px auto; border: 2px solid #e5e7eb; border-radius: 8px;"
                    />
                    
                    <p style="margin-top: 25px; font-size: 0.85em; color: #6b7280;">
                        We look forward to seeing you there! 
                    </p>
                </div>
            `,
        };

        // --- 4. Add QR Code as CID Attachment (for non-reset emails) ---
        if (!isReset && data.qrCodeBase64) {
            // Convert data URL to buffer
            const base64Data = data.qrCodeBase64.replace(/^data:image\/\w+;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');
            
            mailOptions.attachments = [
                {
                    filename: 'qrcode.png',
                    content: imageBuffer,
                    cid: 'qrcode' // Referenced in HTML as src="cid:qrcode"
                }
            ];
        }

        // ✅ Get transporter when we actually need it (after dotenv has loaded)
        const emailTransporter = getTransporter();
        await emailTransporter.sendMail(mailOptions);
        console.log(`[Email Service] ${headerTitle} sent successfully to ${toEmail}`);

    } catch (error) {
        console.error(`[Email Service] Failed to send email to ${toEmail}:`, error.message);
        // ✅ Re-throw the error so the controller can catch it
        throw error;
    }
};