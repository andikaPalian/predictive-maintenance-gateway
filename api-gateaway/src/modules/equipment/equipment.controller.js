import { catchAsync } from "../../utils/catchAsync.js";
import * as equipmentService from "./equipment.service.js";

export const createEquipment = catchAsync(async (req, res, next) => {
  const newEquipment = await equipmentService.createEquipment(req.body);

  return res.status(201).json({
    success: true,
    message: "Equipment created successfully",
    data: newEquipment,
  });
});

export const getAllEquipments = catchAsync(async (req, res, next) => {
  const { skip, limit } = req.query;

  const equipments = await equipmentService.getAllEquipments(skip, limit);

  return res.status(200).json({
    success: true,
    message: "Equipments retrieved successfully",
    meta: {
      skip,
      limit,
      currentCount: equipments.data.length,
      total: equipments.total,
      totalPages: Math.ceil(equipments.total / limit),
    },
    data: equipments.data,
  });
});

export const getEquipmentById = catchAsync(async (req, res, next) => {
  const { equipmentId } = req.params;

  const equipment = await equipmentService.getEquipmentById(equipmentId);

  return res.status(200).json({
    success: true,
    message: "Equipment retrieved successfully",
    data: equipment,
  });
});

export const updateEquipment = catchAsync(async (req, res, next) => {
  const { equipmentId } = req.params;

  const updatedEquipment = await equipmentService.updateEquipment(equipmentId, req.body);

  return res.status(200).json({
    success: true,
    message: "Equipment updated successfully",
    data: updatedEquipment,
  });
});

export const deleteEquipment = catchAsync(async (req, res, next) => {
  const { equipmentId } = req.params;

  await equipmentService.deleteEquipment(equipmentId);

  return res.status(200).json({
    success: true,
    message: "Equipment deleted successfully",
    data: null,
  });
});
