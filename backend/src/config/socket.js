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



  // Track viewers and polls per event room
  const roomViewers = {};
  let roomPolls = {};

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
    socket.on("sendEventChatMessage", ({ eventId, userName, message, isHost }) => {
      if (!eventId || !message) return;
      io.to(`event:${eventId}`).emit("eventChatMessage", {
        userName: userName || "Anonymous",
        message,
        isHost: !!isHost,
        timestamp: new Date().toISOString(),
      });
    });

    // Pin message
    socket.on("pinEventMessage", ({ eventId, message }) => {
      if (!eventId || !message) return;
      io.to(`event:${eventId}`).emit("eventPinnedMessage", message);
    });

    // Unpin message
    socket.on("unpinEventMessage", ({ eventId }) => {
      if (!eventId) return;
      io.to(`event:${eventId}`).emit("eventUnpinMessage");
    });

    // Create poll
    socket.on("createEventPoll", ({ eventId, poll }) => {
      if (!eventId || !poll) return;
      // Store poll in memory per room
      if (!roomPolls) roomPolls = {};
      roomPolls[eventId] = poll;
      io.to(`event:${eventId}`).emit("eventPoll", poll);
    });

    // Vote on poll
    socket.on("voteEventPoll", ({ eventId, optionIndex, userName }) => {
      if (!eventId || !roomPolls?.[eventId]) return;
      const poll = roomPolls[eventId];
      if (optionIndex >= 0 && optionIndex < poll.options.length) {
        poll.options[optionIndex].votes++;
        poll.totalVotes++;
        io.to(`event:${eventId}`).emit("eventPollUpdate", poll);
      }
    });

    // End poll
    socket.on("endEventPoll", ({ eventId }) => {
      if (!eventId) return;
      if (roomPolls?.[eventId]) delete roomPolls[eventId];
      io.to(`event:${eventId}`).emit("eventPollEnd");
    });

    // React to message
    socket.on("reactToEventMessage", ({ eventId, messageId, emoji, userName }) => {
      if (!eventId || !messageId || !emoji) return;
      io.to(`event:${eventId}`).emit("eventMessageReaction", { messageId, emoji, userName });
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
