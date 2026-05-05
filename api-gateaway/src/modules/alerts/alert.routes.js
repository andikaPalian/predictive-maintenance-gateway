import express from "express";
import { validate } from "../../middlewares/validate.js";
import { alertIdParamSchema, createAlertSchema, getAlertQuerySchema } from "./alert.schema.js";
import {
  acknowledgeAlert,
  createAlert,
  deleteAlert,
  getAlertById,
  getAllAlerts,
} from "./alert.controller.js";

export const alertRouter = express.Router();

alertRouter.post("/", validate(createAlertSchema), createAlert);
alertRouter.get("/", validate(getAlertQuerySchema), getAllAlerts);
alertRouter.get("/:alertId", validate(alertIdParamSchema), getAlertById);
alertRouter.patch("/:alertId", validate(alertIdParamSchema), acknowledgeAlert);
alertRouter.delete("/:alertId", validate(alertIdParamSchema), deleteAlert);
