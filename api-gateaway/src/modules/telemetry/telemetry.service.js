import Telemetry from "./telemetry.model.js";
import { publishToQueue } from "../../services/rabbitmq.service.js";
import logger from "../../utils/logger.js";

export const processAndSaveTelemetry = async (telemetryData) => {
  let currentSyncStatus = "PENDING";

  try {
    // Try to send data to RabbitMQ
    await publishToQueue("sensor_data", telemetryData);

    // If successful, update syncStatus to SYNCED
    currentSyncStatus = "SYNCED";
  } catch (error) {
    // If there's an error sending to RabbitMQ, update syncStatus to FAILED
    currentSyncStatus = "FAILED";

    logger.warn(
      `[TELEMETRY SERVICE] Data saved but failed to send to RabbitMQ. ID: ${newTelemetry._id} | Error: ${error.message}`,
    );
  }

  const newTelemetry = await Telemetry.create({
    equipmentId: telemetryData.equipmentId,
    timestamp: telemetryData.timestamp || new Date(),
    metrics: telemetryData.metrics,
    status: telemetryData.status,
    syncStatus: currentSyncStatus,
  });

  if (currentSyncStatus === "SYNCED") {
    logger.info(
      `[TELEMETRY SERVICE] Data saved and sent to RabbitMQ successfully. ID: ${newTelemetry._id}`,
    );
  }
  return newTelemetry;
};
