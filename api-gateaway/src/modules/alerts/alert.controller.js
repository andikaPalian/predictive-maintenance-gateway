import { catchAsync } from "../../utils/catchAsync.js";
import * as alertService from "./alert.service.js";

export const createAlert = catchAsync(async (req, res, next) => {
  const newAlert = await alertService.createAlert(req.body);

  return res.status(201).json({
    success: true,
    message: "Alert created successfully",
    data: newAlert,
  });
});

export const getAllAlerts = catchAsync(async (req, res, next) => {
  const { skip, limit, equipmentId, severty, isAcknowledged } = req.query;
  const filters = { equipmentId, severty, isAcknowledged };

  const alerts = await alertService.getAllAlerts(skip, limit, filters);

  return res.status(200).json({
    success: true,
    message: "Alerts retrieved successfully",
    meta: {
      skip,
      limit,
      currentCount: alerts.data.length,
      total: alerts.total,
      totalPages: Math.ceil(alerts.total / limit),
    },
    data: alerts.data,
  });
});

export const getAlertById = catchAsync(async (req, res, next) => {
  const { aleertId } = req.params;

  const alert = await alertService.getAlertById(aleertId);

  return res.status(200).json({
    success: true,
    message: "Alert retrieved successfully",
    data: alert,
  });
});

export const acknowledgeAlert = catchAsync(async (req, res, next) => {
  const { alertId } = req.params;

  const acknowledgedAlert = await alertService.acknowledgeAlert(alertId);

  return res.status(200).json({
    success: true,
    message: "Alert acknowledged successfully",
    data: acknowledgedAlert,
  });
});

export const deleteAlert = catchAsync(async (req, res, next) => {
  const { alertId } = req.params;

  await alertService.deleteAlert(alertId);

  return res.status(200).json({
    success: true,
    message: "Alert deleted successfully",
    data: null,
  });
});
