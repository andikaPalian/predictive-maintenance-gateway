import express from "express";
import { validate } from "../../middlewares/validate.js";
import {
  createMaintenanceLogSchema,
  getMaintenanceLogIdParamSchema,
  getMaintenanceLogsQuerySchema,
  updateMaintenanceLogSchema,
} from "./maintenance.schema.js";
import {
  createMaintenanceLog,
  deleteMaintenanceLog,
  getAllMaintenanceLogs,
  getMaintenanceLogById,
  updateMaintenanceLog,
} from "./maintenance.controller.js";

export const maintenanceRouter = express.Router();

maintenanceRouter.post("/", validate(createMaintenanceLogSchema), createMaintenanceLog);
maintenanceRouter.get("/", validate(getMaintenanceLogsQuerySchema), getAllMaintenanceLogs);
maintenanceRouter.get("/:logId", validate(getMaintenanceLogIdParamSchema), getMaintenanceLogById);
maintenanceRouter.patch("/:logId", validate(updateMaintenanceLogSchema), updateMaintenanceLog);
maintenanceRouter.delete("/:logId", validate(getMaintenanceLogIdParamSchema), deleteMaintenanceLog);
