import cron from "node-cron";
import { publishToQueue } from "../services/rabbitmq.service.js";
import TelemetryOutbox from "../modules/telemetry/telemetryOutbox.model.js";

const startTelemetryRetryWorker = () => {
  cron.schedule("*/1 * * * *", async () => {
    try {
      const failedData = await TelemetryOutbox.find().limit(100).lean();
      if (failedData.length === 0) return;

      console.log(
        `[Telemetry Retry Worker] Found ${failedData.length} failed records. Retrying...`,
      );

      for (const record of failedData) {
        try {
          await publishToQueue("sensor_data", record.payload);
          await TelemetryOutbox.findByIdAndDelete(record._id);
        } catch (error) {
          console.warn(
            `[Telemetry Retry Worker] Failed to resend record ID: ${record._id}. Error: ${error.message}`,
          );
          break;
        }
      }
    } catch (error) {
      console.error(
        "[Telemetry Retry Worker] Error occurred while processing failed records.",
        error.message,
      );
    }
  });
  console.log("[Telemetry Retry Worker] Started and running every minute.");
};

export default startTelemetryRetryWorker;
