import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
  
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
// import analyticsRoutes from "./routes/analytics.routes.js";
   
dotenv.config();
connectDB();  
 
const app = express();
const clientOrigin = process.env.CLIENT_ORIGIN;

// Middlewares
app.use(express.json());
app.use(cors({
    origin: clientOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Crucial for sending JWT/cookies
}));
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/uploads", express.static("uploads"));
// app.use("/api/analytics", analyticsRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("APP is running...");
});

export default app;
