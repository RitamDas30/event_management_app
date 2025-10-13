import express from "express";
import cors from "cors";
import morgan from "morgan";
  
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import User from "./models/user.model.js"; 
// import analyticsRoutes from "./routes/analytics.routes.js";

// ❌ REMOVED: dotenv.config() - this is handled in server.js
// ❌ REMOVED: connectDB() - this is handled in server.js
 
const app = express();

// const isProduction = process.env.NODE_ENV === 'production';
// const allowedOrigin = isProduction 
//     ? process.env.CLIENT_ORIGIN 
//     : 'http://localhost:5173'; 

const allowedOrigins = [
    'https://eventmanagementapp-ritam.vercel.app', // Production
    'http://localhost:5173', // Local development
];

// Middlewares
app.use(express.json());

// app.use(cors({
//     origin: allowedOrigin,
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     credentials: true,
// }));

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Allow all Vercel preview deployments
        if (origin.includes('vercel.app')) {
            return callback(null, true);
        }
        
        // Allow specific origins
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
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