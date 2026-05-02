import { catchAsync } from "../../utils/catchAsync.js";
import * as maintenanceeService from "./maintenance.service.js";

export const createMaintenanceLog = catchAsync(async (req, res, next) => {
  const newLog = await maintenanceeService.createMaintenanceLog(req.body);

  return res.status(201).json({
    success: true,
    message: "Maintenance log created successfully",
    data: newLog,
  });
});

export const getAllMaintenanceLogs = catchAsync(async (req, res, next) => {
  const { skip, limit, equipmentId } = req.query;

  const logs = await maintenanceeService.getAllMaintenanceLogs(skip, limit, equipmentId);

  return res.status(200).json({
    success: true,
    message: "Maintenance logs retrieved successfully",
    meta: {
      skip,
      limit,
      currentCount: logs.data.length,
      total: logs.total,
      totalPages: Math.ceil(logs.total / limit),
    },
    data: logs.data,
  });
});

export const getMaintenanceLogById = catchAsync(async (req, res, next) => {
  const { logId } = req.params;

  const log = await maintenanceeService.getMaintenanceLogById(logId);

  return res.status(200).json({
    success: true,
    message: "Maintenance log retrieved successfully",
    data: log,
  });
});

export const updateMaintenanceLog = catchAsync(async (req, res, next) => {
  const { logId } = req.params;

  const updatedLog = await maintenanceeService.updateMaintenanceLog(logId, req.body);

  return res.status(200).json({
    success: true,
    message: "Maintenance log updated successfully",
    data: updatedLog,
  });
});

export const deleteMaintenanceLog = catchAsync(async (req, res, next) => {
  const { logId } = req.params;

  await maintenanceeService.deleteMaintenanceLog(logId);

  return res.status(200).json({
    success: true,
    message: "Maintenance log deleted successfully",
    data: null,
  });
});
