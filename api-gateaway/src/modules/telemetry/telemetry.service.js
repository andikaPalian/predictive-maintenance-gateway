import Telemetry from "./telemetry.model.js";
import { publishToQueue } from "../../services/rabbitmq.service.js";
import logger from "../../utils/logger.js";

export const processAndSaveTelemetry = async (telemetryData) => {
  const newTelemetry = await Telemetry.create({
    equipmentId: telemetryData.equipmentId,
    timestamp: telemetryData.timestamp || new Date(),
    metrics: telemetryData.metrics,
    status: telemetryData.status,
    syncStatus: "PENDING",
  });

  try {
    // Try to send data to RabbitMQ
    await publishToQueue("sensor_data", newTelemetry);

    // If successful, update syncStatus to SYNCED
    newTelemetry.syncStatus = "SYNCED";
    await newTelemetry.save();

    logger.info(
      `[TELEMETRY SERVICE] Data saved and sent to RabbitMQ successfully. ID: ${newTelemetry._id}`,
    );
  } catch (error) {
    // If there's an error sending to RabbitMQ, update syncStatus to FAILED
    newTelemetry.syncStatus = "FAILED";
    await newTelemetry.save();

    logger.warn(
      `[TELEMETRY SERVICE] Data saved but failed to send to RabbitMQ. ID: ${newTelemetry._id} | Error: ${error.message}`,
    );
  }

  return newTelemetry;
};
