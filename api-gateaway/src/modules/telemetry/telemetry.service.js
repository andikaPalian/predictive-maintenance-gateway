import Telemetry from "./telemetry.model.js";
import TelemetryOutbox from "./telemetryOutbox.model.js";
import { publishToQueue } from "../../services/rabbitmq.service.js";
import * as alertService from "../alerts/alert.service.js";
import logger from "../../utils/logger.js";

export const processAndSaveTelemetry = async (telemetryData) => {
  const newTelemetry = await Telemetry.create({
    equipmentId: telemetryData.equipmentId,
    timestamp: telemetryData.timestamp || new Date(),
    metrics: telemetryData.metrics,
    status: telemetryData.status,
    // syncStatus: currentSyncStatus,
  });

  try {
    // Try to send data to RabbitMQ
    await publishToQueue("sensor_data", telemetryData);
  } catch (error) {
    // If there's an error sending to RabbitMQ, update syncStatus to FAILED
    // currentSyncStatus = "FAILED";
    // rabbitMqError = error.message;
    logger.warn(`[TELEMETRY SERVICE] RabbitMQ failed. Saving to Outbox... Error: ${error.message}`);

    await TelemetryOutbox.create({ payload: newTelemetry });
  }

  return newTelemetry;
};
