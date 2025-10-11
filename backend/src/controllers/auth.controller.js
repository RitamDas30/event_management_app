import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'; // Assuming you fixed the package name to 'bcrypt'

// Helper function to Generate JWT Token
const generateToken = (user) => {
  // Ensure JWT_SECRET is available via process.env
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // 1. Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Create user (Mongoose pre-save hook handles password hashing)
    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);

    // 3. Respond with token and user details
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
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
    console.error(error);
    res.status(500).json({ message: "Login failed: " + error.message });
  }
};

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
// RENAMED from getProfile to match router's import
export const getCurrentUser = async (req, res) => {
  try {
    // req.user.id is set by the 'protect' middleware
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
        return res.status(404).json({ message: "User profile not found." });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profile: " + error.message });
  }
};
