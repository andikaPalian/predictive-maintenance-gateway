import * as alertRepository from "./alert.repository.js";
import * as equipmentRepository from "../equipment/equipment.repository.js";
import { AppError } from "../../utils/error.js";
import logger from "../../utils/logger.js";

export const createAlert = async (alertData) => {
  const equipment = await equipmentRepository.findById(alertData.equipmentId);
  if (!equipment) {
    logger.warn(
      `[ALERT SERVICE] Failed to create alert: Equipment ID ${alertData.equipmentId} not found`,
    );
    throw new AppError("Equipment not found. Cannot create alert", 404);
  }

  const newAlert = await alertRepository.create(alertData);

  logger.info(
    `[ALERT SERVICE] New alert created: ${newAlert.severity} on Equipment ${equipment.name}`,
  );

  if (newAlert.severity === "CRITICAL" && equipment.status !== "CRITICAL") {
    await equipmentRepository.update(alertData.equipmentId, { status: "CRITICAL" });
    logger.info(`[ALERT SERVICE] Equipment ${equipment.name} status auto-escalated to CRITICAL`);
  }

  return newAlert;
};

export const getAllAlerts = async (skip = 0, limit = 100, filters = {}) => {
  const [data, total] = await Promise.all([
    alertRepository.findAll(skip, limit, filters),
    alertRepository.count(filters),
  ]);

  return {
    data,
    total,
  };
};

export const getAlertById = async (alertId) => {
  const alert = await alertRepository.findById(alertId);
  if (!alert) {
    throw new AppError("Alert not found", 404);
  }

  return alert;
};

export const acknowledgeAlert = async (alertId) => {
  const alert = await alertRepository.findById(alertId);
  if (!alert) {
    throw new AppError("Alert not found", 404);
  }

  if (alert.isAcknowledged) {
    logger.info(
      `[ALERT SERVICE] Attempted to acknowledge already acknowledged alert with ID: ${alertId}`,
    );
    throw new AppError("Alert is already acknowledged by another operator", 400);
  }

  const updateAlert = await alertRepository.update(alertId, { isAcknowledged: true });

  logger.info(`[ALERT SERVICE] Alert with ID: ${alertId} acknowledged successfully.`);

  return updateAlert;
};

export const deleteAlert = async (alertId) => {
  const alert = await alertRepository.findById(alertId);
  if (!alert) {
    throw new AppError("Alert not found", 404);
  }

  await alertRepository.remove(alertId);

  logger.info(`[ALERT SERVICE] Deleted alert with ID: ${alertId} successfully.`);

  return true;
};
