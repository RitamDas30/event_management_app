import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const seedUsers = [
  {
    name: "Student User",
    email: "student@student.com",
    password: "student",
    role: "student",
    bio: "Test student account for development",
    interests: ["Technical", "Cultural"],
  },
  {
    name: "Organizer User",
    email: "organizer@organizer.com",
    password: "organizer",
    role: "organizer",
    bio: "Test organizer account for development",
    interests: ["Technical", "Academic"],
  },
  {
    name: "Admin User",
    email: "admin@admin.com",
    password: "admin",
    role: "admin",
    bio: "Test admin account for development",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
      console.log(`  Dropped: ${col.name}`);
    }
    console.log("Database cleared");

    // Create test users
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      console.log(`  Created: ${user.email} (${user.role}) — password: ${userData.password}`);
    }

    console.log("\nSeed complete! Test accounts:");
    console.log("  student@student.com / student");
    console.log("  organizer@organizer.com / organizer");
    console.log("  admin@admin.com / admin");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

seed();
