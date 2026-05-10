import amqplib from "amqplib";
import logger from "../utils/logger.js";

let connection = null;
let channel = null;
let isReconnecting = false;

const handleReconnect = () => {
  isReconnecting = true;
  connection = null;
  channel = null;

  logger.info("[RABBITMQ CONFIG] Will try to reconnect to RabbitMQ...");

  setTimeout(() => {
    connectRabbitMQ();
  }, 5000);
};

export const connectRabbitMQ = async () => {
  const RABBIT_URL = process.env.RABBITMQ_URL;

  try {
    connection = await amqplib.connect(RABBIT_URL);
    channel = await connection.createConfirmChannel();

    await channel.assertQueue("sensor_data", { durable: true });

    logger.info(
      "[RABBITMQ CONFIG] Successfully connected to RabbitMQ and confirm channel created.",
    );

    isReconnecting = false;

    // Event listeners for automatic reconnection
    connection.on("error", (err) => {
      logger.error(`[RABBITMQ CONFIG] Connection error: ${err.message}`);
      if (!isReconnecting) handleReconnect();
    });

    connection.on("close", () => {
      logger.warn("[RABBITMQ CONFIG] Connection closed. Attempting to reconnect...");
      if (!isReconnecting) handleReconnect();
    });

    return channel;
  } catch (error) {
    console.error("Failed to connect to RabbitMQ", error);
    if (!isReconnecting) handleReconnect();
  }
};

export const getRabbitChannel = () => {
  // if (!channel) {
  //   throw new Error("RabbitMQ channel not initialized.");
  // }

  return channel;
};

export const closeRabbitMQ = async () => {
  try {
    await channel.close();
    await connection.close();
    logger.info("[RABBITMQ CONFIG] Connection closed gracefully.");
  } catch (error) {
    logger.error(`[RABBITMQ CONFIG] Failed to close connection: ${error.message}`);
  }
};
