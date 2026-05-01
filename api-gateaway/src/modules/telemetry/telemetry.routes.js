import express from "express";
import { ingestTelemetryData } from "./telemetry.controller.js";
import { validate } from "../../middlewares/validate.js";
import { createTelemetrySchema } from "./telemetry.schema.js";

export const telemetryRouter = express.Router();

telemetryRouter.post("/", validate(createTelemetrySchema), ingestTelemetryData);
