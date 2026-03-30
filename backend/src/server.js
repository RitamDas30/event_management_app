// src/server.js

// Load environment variables FIRST, before ANY imports
import dotenv from "dotenv";
dotenv.config();

// NOW import everything else
import http from "http";
import app from "./app.js";
import logger from "./config/logger.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { startCronJobs } from "./services/cron.service.js";

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

initSocket(server);

startCronJobs();

server.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, "Server running");
});