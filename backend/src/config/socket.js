// src/config/socket.js
import { Server } from "socket.io";
let io = null;
export const initSocket = (server) => {
  if (io) return io;

  // io = new Server(server, {
  //   cors: {
  //     origin: process.env.CLIENT_ORIGIN || "*", // tighten this in production
  //     methods: ["GET", "POST"],
  //   },
  // });

  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow no origin or any vercel.app subdomain
        if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    },
  });



  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });

  return io;
};

/**
 * getIO()
 * - Use this inside controllers at runtime (after initSocket has been called).
 * - If not initialized, it throws — controllers should catch and handle that.
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  }
  return io;
};
