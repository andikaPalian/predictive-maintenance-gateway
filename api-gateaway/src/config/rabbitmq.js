import amqplib from "amqplib";

let connection;
let channel;

export const connectRabbitMQ = async () => {
  const RABBIT_URL = process.env.RABBITMQ_URL;

  try {
    connection = await amqplib.connect(RABBIT_URL);
    channel = await connection.createChannel();

    await channel.assertQueue("sensor_data", { durable: true });

    console.log("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    console.error("Failed to connect to RabbitMQ", error);
    process.exit(1);
  }
};

export const getRabbitChannel = () => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized.");
  }

  return channel;
};

export const closeRabbitMQ = async () => {
  try {
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Failed to close RabbitMQ connection", error);
  }
};
