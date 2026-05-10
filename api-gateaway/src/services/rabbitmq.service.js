import { getRabbitChannel } from "../config/rabbitmq.js";
import logger from "../utils/logger.js";

export const publishToQueue = async (queueName, data) => {
  try {
    const channel = getRabbitChannel();
    if (!channel) {
      throw new Error("RabbitMQ channel not initialized.");
    }

    const messageBuffer = Buffer.from(JSON.stringify(data));

    // Sent message to queue
    const isSent = channel.sendToQueue(queueName, messageBuffer, { persistent: true });

    // Wait for confirmation from broker that data has touched the disk
    await channel.waitForConfirms();

    if (!isSent) {
      logger.warn(`[RABBITMQ SERVICE] TCP Buffer full. Queue slowed down for ${queueName}`);
    }

    return true;
  } catch (error) {
    logger.error(`[RABBITMQ SERVICE] Failed to publish message to queue: ${queueName}`, error);
    throw new Error(error.message);
  }
};
