// src/server.js

// ✅ CRITICAL: Load environment variables FIRST, before ANY imports
import dotenv from "dotenv";
dotenv.config();

// NOW import everything else
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { startCronJobs } from "./services/cron.service.js"; 

const PORT = process.env.PORT || 5000;
 
// Connect to the database
connectDB();
  
// 1. Create the HTTP server using the Express app
const server = http.createServer(app);

// 2. Initialize Socket.io with the HTTP server
initSocket(server);

// Start the scheduled tasks after DB connection
startCronJobs();

// 3. Start the server (handles both HTTP and Socket.io traffic)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (env: ${process.env.NODE_ENV})`);
});