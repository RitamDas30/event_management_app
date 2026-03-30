// src/config/socket.js
import { Server } from "socket.io";
import logger from "./logger.js";
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
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket(server) first.");
  }
  return io;
};
