import express from "express";
import { validate } from "../../middlewares/validate.js";
import {
  createEquipmentSchema,
  equipmentIdParamSchema,
  getEquipmentQuerySchema,
  updateEquipmentSchema,
} from "./equipment.schema.js";
import {
  createEquipment,
  deleteEquipment,
  getAllEquipments,
  getEquipmentById,
  updateEquipment,
} from "./equipment.controller.js";

export const equipmentRouter = express.Router();

equipmentRouter.post("/", validate(createEquipmentSchema), createEquipment);
equipmentRouter.get("/", validate(getEquipmentQuerySchema), getAllEquipments);
equipmentRouter.get("/:equipmentId", validate(equipmentIdParamSchema), getEquipmentById);
equipmentRouter.patch("/:equipmentId", validate(updateEquipmentSchema), updateEquipment);
equipmentRouter.delete("/:equipmentId", validate(equipmentIdParamSchema), deleteEquipment);
