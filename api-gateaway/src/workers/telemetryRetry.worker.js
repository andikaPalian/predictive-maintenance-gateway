import cron from "node-cron";
import Telemetry from "../modules/telemetry/telemetry.model.js";
import { publishToQueue } from "../services/rabbitmq.service.js";

const startTelemetryRetryWorker = () => {
  cron.schedule("*/1 * * * *", async () => {
    try {
      const failedData = await Telemetry.find({ syncStatus: "FAILED" }).limit(100).lean();
      if (failedData.length === 0) return;

      console.log(
        `[Telemetry Retry Worker] Found ${failedData.length} failed records. Retrying...`,
      );

      for (const record of failedData) {
        try {
          await publishToQueue("sensor_data", record);
          await Telemetry.updateOne({ _id: record._id }, { $set: { syncStatus: "SYNCED" } });
        } catch (error) {
          console.warn(
            `[Telemetry Retry Worker] Failed to resend record ID: ${record._id}. Will retry later.`,
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
