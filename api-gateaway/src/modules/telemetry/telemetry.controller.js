import { catchAsync } from "../../utils/catchAsync.js";
import { processAndSaveTelemetry } from "./telemetry.service.js";

export const ingestTelemetryData = catchAsync(async (req, res, next) => {
  const saveData = await processAndSaveTelemetry(req.body);

  return res.status(201).json({
    success: true,
    message: "Telemetry data ingested successfully",
    data: saveData,
  });
});
