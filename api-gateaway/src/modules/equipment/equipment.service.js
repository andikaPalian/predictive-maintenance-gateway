import * as equipmentRepository from "./equipment.repository.js";
import { AppError } from "../../utils/error.js";
import logger from "../../utils/logger.js";

export const createEquipment = async (equipmentData) => {
  const existingEquipment = await equipmentRepository.findByName(equipmentData.name);
  if (existingEquipment) {
    logger.warn(`[EQUIPMENT SERVICE] Equipment with name "${equipmentData.name}" already exists.`);
    throw new AppError("Equipment with this name already exists", 409);
  }

  const newEquipment = await equipmentRepository.create(equipmentData);
  logger.info(`[EQUIPMENT SERVICE] Created new equipment with ID: ${newEquipment.id}`);

  return newEquipment;
};

export const getAllEquipments = async (skip = 0, limit = 100) => {
  const [data, total] = await Promise.all([
    equipmentRepository.findAll(skip, limit),
    equipmentRepository.count(),
  ]);

  return {
    data,
    total,
  };
};

export const getEquipmentById = async (equipmentId) => {
  const equipment = await equipmentRepository.findById(equipmentId);
  if (!equipment) {
    throw new AppError("Equipment not found", 404);
  }

  return equipment;
};

export const updateEquipment = async (equipmentId, updateData) => {
  const equipment = await equipmentRepository.findById(equipmentId);
  if (!equipment) {
    throw new AppError("Equipment not found", 404);
  }

  if (updateData.name && updateData.name !== equipment.name) {
    const isNameTaken = await equipmentRepository.findByName(updateData.name);
    if (isNameTaken) {
      logger.warn(`[EQUIPMENT SERVICE] Equipment name "${updateData.name}" is already taken.`);
      throw new AppError("Equipment name is already taken", 409);
    }
  }

  const updatedEquipment = await equipmentRepository.update(equipmentId, updateData);
  logger.info(`[EQUIPMENT SERVICE] Updated equipment with ID: ${equipmentId} successfully.`);

  return updatedEquipment;
};

export const deleteEquipment = async (equipmentId) => {
  const equipment = await equipmentRepository.findById(equipmentId);
  if (!equipment) {
    throw new AppError("Equipment not found", 404);
  }

  await equipmentRepository.remove(equipmentId);
  logger.info(`[EQUIPMENT SERVICE] Deleted equipment with ID: ${equipmentId} successfully.`);

  return true;
};
