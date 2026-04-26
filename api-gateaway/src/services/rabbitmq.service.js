import { getRabbitChannel } from "../config/rabbitmq.js";

export const publishToQueue = async (queueName, data) => {
  try {
    const channel = getRabbitChannel();
    if (!channel) {
      throw new Error("RabbitMQ channel not initialized.");
    }

    await channel.assertQueue(queueName, { durable: true });

    const messageBuffer = Buffer.from(JSON.stringify(data));

    const isSent = channel.sendToQueue(queueName, messageBuffer, { persistent: true });

    if (!isSent) {
      throw new Error("[Message Broker Warning] Buffer full, message to queue may be delayed.");
    }

    return true;
  } catch (error) {
    console.error("Failed to publish message to RabbutMQ", error);
    throw new Error("Queue infrastructure error: ");
  }
};
