import mongoose from 'mongoose'
import bcrypt from 'bcrypt' // Standardize on 'bcrypt' for consistency

const userSchema = new mongoose.Schema({
    // RENAMED from userName to name to match controller/request body
    name: { 
        type: String, 
        required: true, 
    },

    email: {
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
    },
    // The select: false option hides the password by default, but it's not needed here 
    // because you manually add .select('+password') in the login controller.
    password: {
        type: String,
        required: function () {
            // Password not required for OAuth users
            return !this.googleId && !this.githubId;
        },
    },
    authProvider: {
        type: String,
        enum: ["local", "google", "github"],
        default: "local",
    },
    googleId: {
        type: String,
        sparse: true,
    },
    githubId: {
        type: String,
        sparse: true,
    },
    role: {
        type: String,
        enum: ["student", "organizer", "admin"],
        default: "student"
    },
    avatar: {
        type: String,
        default: "",
    },
    bio: {
        type: String,
        maxlength: 500,
        default: "",
    },
    interests: {
        type: [String],
        default: [],
    },
    socialLinks: {
        website: { type: String, default: "" },
        github: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        twitter: { type: String, default: "" },
    },
    notificationPreferences: {
        emailReminders: { type: Boolean, default: true },
        emailUpdates: { type: Boolean, default: true },
        emailPromotions: { type: Boolean, default: false },
    },
    // Legacy field kept for compatibility
    preferences: {
        type: [String],
        default: [],
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    
}, { timestamps: true }) // Correct way to enable Mongoose timestamps

// CRITICAL FIX: Use 'function' keyword for 'this' context, and fix the logic check
userSchema.pre("save", async function (next) {
    // If password hasn't been modified, skip hashing
    if (!this.isModified("password")) {
        return next();
    } 
    
    // Hash the password with a salt round (e.g., 10)
    this.password = await bcrypt.hash(this.password, 10);
    next(); 
});

// Helper method for login
userSchema.methods.matchPassword = async function (enteredPassword){
    // bcrypt.compare works correctly regardless of whether the password field was selected
    return await bcrypt.compare(enteredPassword, this.password);
}

export default mongoose.model("User", userSchema)
