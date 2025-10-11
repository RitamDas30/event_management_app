// src/server.js
import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";

// Load environment variables immediately
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

// 1. Create the HTTP server using the Express app
const server = http.createServer(app);

// 2. Initialize Socket.io with the HTTP server
initSocket(server);

// 3. Start the server (handles both HTTP and Socket.io traffic)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (env: ${process.env.NODE_ENV})`);
});