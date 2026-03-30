import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import * as Sentry from "@sentry/node";

import logger from "./config/logger.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import registrationRoutes from "./routes/registration.routes.js";

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const swaggerSpecPath = path.join(path.resolve(), 'swagger.yaml');
const swaggerDocument = YAML.load(swaggerSpecPath);

// --- Sentry Error Tracking ---
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
  logger.info("Sentry initialized");
}

const app = express();

const allowedOrigins = [
    'https://eventmanagementapp-ritam.vercel.app',
    'http://localhost:5173',
];

// --- Security Middleware ---
app.use(helmet());

// --- Body Parsing ---
app.use(express.json());

// --- CORS ---
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.includes('vercel.app')) return callback(null, true);
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

// --- Structured HTTP Logging (replaces morgan) ---
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/" || req.url === "/api-docs" } }));

// --- Rate Limiting ---
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// --- Docs ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/uploads", express.static("uploads"));

// --- Health Check ---
app.get("/", (req, res) => {
  res.send("APP is running... View documentation at /api-docs");
});

// --- Sentry Error Handler (must be before custom error handler) ---
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// --- Global Error Handler ---
import errorHandler from "./middleware/error.middleware.js";
app.use(errorHandler);

export default app;