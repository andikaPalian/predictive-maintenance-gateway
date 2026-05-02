import * as equipmentRepository from "../equipment/equipment.repository.js";
import * as maintenanceRepository from "./maintenance.repository.js";
import { AppError } from "../../utils/error.js";
import logger from "../../utils/logger.js";

export const createMaintenanceLog = async (logData) => {
  const equipment = await equipmentRepository.findById(logData.equipmentId);
  if (!equipment) {
    logger.warn(
      `[MAINTENANCE SERVICE] Attempted to create maintenance log for non-existent equipment ID: ${logData.equipmentId}`,
    );
    throw new AppError("Equipment not found, cannot create maintenance log", 404);
  }

  const newLog = await maintenanceRepository.create(logData);

  logger.info(
    `[MAINTENANCE SERVICE] Created maintenance log with ID: ${newLog.id} for equipment ID: ${logData.equipmentId}`,
  );

  return newLog;
};

export const getAllMaintenanceLogs = async (skip = 0, limit = 100, equipmentId = null) => {
  const filters = equipmentId ? { equipmentId } : {};
  const [data, total] = await Promise.all([
    maintenanceRepository.findAll(skip, limit, filters),
    maintenanceRepository.count(filters),
  ]);

  return {
    data,
    total,
  };
};

export const getMaintenanceLogById = async (logId) => {
  const log = await maintenanceRepository.findById(logId);
  if (!log) {
    throw new AppError("Maintenance log not found", 404);
  }

  return log;
};

export const updateMaintenanceLog = async (logId, updateData) => {
  const log = await maintenanceRepository.findById(logId);
  if (!log) {
    throw new AppError("Maintenance log not found", 404);
  }

  if (updateData.equipmentId && updateData.equipmentId !== log.equipmentId) {
    const equipment = await equipmentRepository.findById(updateData.equipmentId);
    if (!equipment) {
      logger.warn(
        `[MAINTENANCE SERVICE] Attempted to update maintenance log ID: ${logId} with non-existent equipment ID: ${updateData.equipmentId}`,
      );
      throw new AppError("Equipment not found, cannot update maintenance log", 404);
    }
    logger.info(
      `[MAINTENANCE SERVICE] Log ID: ${logId} reassigned to new Equipment ID: ${updateData.equipmentId}`,
    );
  }

  const updatedLog = await maintenanceRepository.update(logId, updateData);

  logger.info(`[MAINTENANCE SERVICE] Updated maintenance log with ID: ${logId} `);

  return updatedLog;
};

export const deleteMaintenanceLog = async (logId) => {
  const log = await maintenanceRepository.findById(logId);
  if (!log) {
    throw new AppError("Maintenance log not found", 404);
  }

  await maintenanceRepository.remove(logId);

  logger.info(`[MAINTENANCE SERVICE] Deleted maintenance log with ID: ${logId} successfully.`);

  return true;
};
