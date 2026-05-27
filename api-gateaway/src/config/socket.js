import { Server } from "socket.io";
import logger from "../utils/logger.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`[WEBSOCKET] Client/Postman connected: ${socket.id}`);

    socket.on("subscribe-equipment", (equipmentId) => {
      const cleanId =
        typeof equipmentId === "string" ? equipmentId.replace(/(^["']|["']$)/g, "") : equipmentId;

      socket.join(cleanId);
      logger.info(
        `[WEBSOCKET] Client ${socket.id} subscribed to equipment equipment-${equipmentId}`,
      );
    });

    socket.on("disconnect", () => {
      logger.info(`[WEBSOCKET] Client/Postman disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
};
