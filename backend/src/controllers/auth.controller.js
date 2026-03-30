import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import { sendEventEmail } from '../services/email.service.js';
import crypto from 'crypto';
import logger from "../config/logger.js"; 

// Helper function to Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// =========================================================
// 1. REGISTER USER
// =========================================================
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    logger.info({ email }, "Registration attempt");
    
    // 1. Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Create user 
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);
    
    logger.info({ userId: user._id }, "User registered");

    // 3. Respond with token and user details
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error({ err: error, email: req.body.email }, "Registration failed");
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
};

// =========================================================
// 2. LOGIN USER
// =========================================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Find user by email and explicitly select the stored password
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Compare the plain text password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // 3. Generate token and respond
    const token = generateToken(user);
    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    logger.error({ err: error, email: req.body.email }, "Login failed");
    res.status(500).json({ message: "Login failed: " + error.message });
  }
};

// =========================================================
// 3. GET CURRENT USER PROFILE
// =========================================================
export const getProfile = async (req, res) => {
  try {
    // req.user.id is set by the 'protect' middleware
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
        return res.status(404).json({ message: "User profile not found." });
    }
    res.json(user);
  } catch (error) {
    logger.error({ err: error, userId: req.user.id }, "Profile fetch failed");
    res.status(500).json({ message: "Failed to fetch profile: " + error.message });
  }
};

// =========================================================
// 4. FORGOT PASSWORD (Send Reset Link)
// =========================================================
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // ✅ FIX 1: Add validation
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        
        logger.info({ email }, "Forgot password requested");

        // 1. Find the user
        const user = await User.findOne({ email });
        if (!user) {
            logger.info({ email }, "User not found for password reset");
            return res.status(404).json({ message: "No user found with that email address." });
        }
        
        logger.info({ userId: user._id }, "Generating reset token");

        // 2. Generate token and expiry time
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 3600000); // 1 hour

        // 3. Save the token and expiry time to the database
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = tokenExpires;
        await user.save({ validateBeforeSave: false }); 
        
        // ✅ FIX 2: Use consistent env variable name with fallback
        const frontendURL = process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
        const resetURL = `${frontendURL}/reset-password?token=${resetToken}&email=${user.email}`;
        
        logger.info({ email: user.email }, "Reset token saved, sending email");

        // 4. Send the email
        try {
            await sendEventEmail(user.email, {
                resetUrl: resetURL,
            }, 'reset'); 
            
            logger.info({ email: user.email }, "Password reset email sent");

            res.status(200).json({ message: 'Password reset email sent successfully.' });
        } catch (emailError) {
            // Email failed - clean up token
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            
            logger.error({ err: emailError }, "Failed to send reset email"); 

            res.status(500).json({ message: 'Error sending reset email. Please try again later.' });
        }
    } catch (error) {
        // ✅ FIX 3: Add outer try-catch for database errors
        logger.error({ err: error }, "Forgot password process failed");
        res.status(500).json({ message: 'Server error during password reset process.' });
    }
};

// =========================================================
// 5. RESET PASSWORD (Apply New Password)
// =========================================================
export const resetPassword = async (req, res) => {
    try {
        const { token, email } = req.query;
        const { password } = req.body;
        
        // ✅ FIX 4: Add validation
        if (!token || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        logger.info({ email }, "Reset password attempt");

        // 1. Find the user based on the valid, non-expired token
        const user = await User.findOne({
            email,
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            logger.warn({ email }, "Reset token invalid or expired");
            return res.status(400).json({ message: 'Token is invalid or has expired.' });
        }

        // 2. Update the password
        user.password = password; 
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save(); 
        
        logger.info({ userId: user._id }, "Password reset successful");

        res.status(200).json({ message: 'Password reset successfully. Please log in.' });
    } catch (error) {
        logger.error({ err: error }, "Reset password failed");
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};