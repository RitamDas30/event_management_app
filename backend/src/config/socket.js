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



  // Track viewers per event room
  const roomViewers = {};

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // Join event room (for live streaming chat)
    socket.on("joinEventRoom", ({ eventId, userName }) => {
      if (!eventId) return;
      socket.join(`event:${eventId}`);
      socket.eventRoom = eventId;
      socket.userName = userName;

      // Track viewer count
      if (!roomViewers[eventId]) roomViewers[eventId] = new Set();
      roomViewers[eventId].add(socket.id);
      io.to(`event:${eventId}`).emit("eventViewerCount", roomViewers[eventId].size);

      logger.info({ socketId: socket.id, eventId, userName }, "Joined event room");
    });

    // Leave event room
    socket.on("leaveEventRoom", ({ eventId }) => {
      if (!eventId) return;
      socket.leave(`event:${eventId}`);

      if (roomViewers[eventId]) {
        roomViewers[eventId].delete(socket.id);
        io.to(`event:${eventId}`).emit("eventViewerCount", roomViewers[eventId].size);
        if (roomViewers[eventId].size === 0) delete roomViewers[eventId];
      }
    });

    // Live chat message
    socket.on("sendEventChatMessage", ({ eventId, userName, message }) => {
      if (!eventId || !message) return;
      io.to(`event:${eventId}`).emit("eventChatMessage", {
        userName: userName || "Anonymous",
        message,
        timestamp: new Date().toISOString(),
      });
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      // Remove from any event room they were in
      if (socket.eventRoom && roomViewers[socket.eventRoom]) {
        roomViewers[socket.eventRoom].delete(socket.id);
        io.to(`event:${socket.eventRoom}`).emit("eventViewerCount", roomViewers[socket.eventRoom].size);
        if (roomViewers[socket.eventRoom].size === 0) delete roomViewers[socket.eventRoom];
      }
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
