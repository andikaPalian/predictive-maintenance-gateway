import Telemetry from "./telemetry.model.js";
import { publishToQueue } from "../../services/rabbitmq.service.js";
import * as alertService from "../alerts/alert.service.js";
import logger from "../../utils/logger.js";

// Safety net to detect anomalies
const analyzeAnomalies = async (telemetryData) => {
  const { equipmentId, metrics } = telemetryData;

  if (!metrics) return;

  if (metrics.temperature) {
    if (metrics.temperature >= 100) {
      await alertService.createAlert({
        equipmentId: equipmentId,
        message: `DANGEROUS: Temperature is dangerously high (${metrics.temperature}°C). Overheat risk!`,
        severity: "CRITICAL",
      });
    } else if (metrics.temperature >= 85) {
      await alertService.createAlert({
        equipmentId: equipmentId,
        message: `WARNING: Temperature is going dangerously high (${metrics.temperature}°C). Overheat risk!`,
        severity: "WARNING",
      });
    }
  }

  if (metrics.vibration) {
    if (metrics.vibration >= 20) {
      await alertService.createAlert({
        equipmentId: equipmentId,
        message: `DANGEROUS: Vibration is dangerously high (${metrics.vibration} mm/s). Stuctural failure imminent!`,
        severity: "CRITICAL",
      });
    } else if (metrics.vibration >= 15) {
      await alertService.createAlert({
        equipmentId: equipmentId,
        message: `WARNING: Vibration is going dangerously high (${metrics.vibration} mm/s).`,
        severity: "WARNING",
      });
    }
  }

  if (metrics.rpm !== undefined && metrics.rpm !== null) {
    if (metrics.rpm >= 3600) {
      await alertService.createAlert({
        equipmentId: equipmentId,
        meesage: `DANGEROUS: RPM is dangerously high (${metrics.rpm} RPM). Risk of catastrophic failure!`,
        severity: "CRITICAL",
      });
    } else if (metrics.rpm <= 500 && metrics.rpm > 0) {
      await alertService.createAlert({
        equipmentId: equipmentId,
        message: `WARNING: Engine RPM is dropping abnormally (${metrics.rpm} RPM). Possible load stall.`,
        severity: "WARNING",
      });
    }
  }
};

export const processAndSaveTelemetry = async (telemetryData) => {
  let currentSyncStatus = "PENDING";
  let rabbitMqError = null;

  try {
    // Try to send data to RabbitMQ
    await publishToQueue("sensor_data", telemetryData);

    // If successful, update syncStatus to SYNCED
    currentSyncStatus = "SYNCED";
  } catch (error) {
    // If there's an error sending to RabbitMQ, update syncStatus to FAILED
    currentSyncStatus = "FAILED";
    rabbitMqError = error.message;
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
  } else {
    logger.warn(
      `[TELEMETRY SERVICE] Data saved but RabbitMQ failed. ID: ${newTelemetry._id} | Error: ${rabbitMqError}`,
    );
  }

  // Fallback anomaly detection
  analyzeAnomalies(telemetryData).catch((err) => {
    logger.error(`[TELEMETRY SERVICE] Fallback anomaly detection failed: ${err.message}`);
  });

  return newTelemetry;
};
