import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'; 
import { sendEventEmail } from '../services/email.service.js';
import crypto from 'crypto'; 

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
    
    console.log(`[AUTH] Attempting registration for: ${email}`);
    
    // 1. Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Create user 
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);
    
    console.log(`[AUTH] User registered successfully: ${user._id}`);

    // 3. Respond with token and user details
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(`[AUTH ERROR] Registration failed for ${req.body.email}:`, error);
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
    console.error(`[AUTH ERROR] Login failed for ${req.body.email}:`, error);
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
    console.error(`[AUTH ERROR] Profile fetch failed for user ID ${req.user.id}:`, error);
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
        
        console.log(`[AUTH] Forgot Password requested for: ${email}`);

        // 1. Find the user
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`[AUTH] User not found, returning 404.`);
            return res.status(404).json({ message: "No user found with that email address." });
        }
        
        console.log(`[AUTH] User found: ${user._id}. Generating token.`);

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
        
        console.log(`[AUTH] Token saved. Attempting to send email to ${user.email}`);
        console.log(`[AUTH] Reset URL generated: ${resetURL}`);

        // 4. Send the email
        try {
            await sendEventEmail(user.email, {
                resetUrl: resetURL,
            }, 'reset'); 
            
            console.log(`[AUTH] ✅ Password reset email successfully SENT to ${user.email}.`);

            res.status(200).json({ message: 'Password reset email sent successfully.' });
        } catch (emailError) {
            // Email failed - clean up token
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            
            console.error(`[AUTH ERROR] ❌ Failed to send reset email:`, emailError.message); 

            res.status(500).json({ message: 'Error sending reset email. Please try again later.' });
        }
    } catch (error) {
        // ✅ FIX 3: Add outer try-catch for database errors
        console.error(`[AUTH ERROR] ❌ Forgot password process failed:`, error);
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
        
        console.log(`[AUTH] Reset Password attempt for: ${email}`);

        // 1. Find the user based on the valid, non-expired token
        const user = await User.findOne({
            email,
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log(`[AUTH] Token invalid or expired for ${email}.`);
            return res.status(400).json({ message: 'Token is invalid or has expired.' });
        }

        // 2. Update the password
        user.password = password; 
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save(); 
        
        console.log(`[AUTH] ✅ Password successfully reset for user ID ${user._id}.`);

        res.status(200).json({ message: 'Password reset successfully. Please log in.' });
    } catch (error) {
        console.error(`[AUTH ERROR] ❌ Reset password failed:`, error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};