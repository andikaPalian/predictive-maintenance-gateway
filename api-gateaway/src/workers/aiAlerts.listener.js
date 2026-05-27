import { consumeFromQueue } from "../config/rabbitmq.js";
import { getIO } from "../config/socket.js";
import * as alertService from "../modules/alerts/alert.service.js";
import logger from "../utils/logger.js";

export const startAlertListener = async () => {
  const queueName = process.env.AI_ALERTS_QUEUE;

  await consumeFromQueue(queueName, async (msg, channel) => {
    try {
      const payload = JSON.parse(msg.content.toString());

      if (payload.severity === "CRITICAL") {
        await alertService.createAlert({
          equipmentId: payload.equipmentId,
          severity: payload.severity,
          message: payload.message,
        });
        logger.info(`[WORKER] AI Alert Auto-Escalated for Equipment: ${payload.equipmentId}`);
      }

      // Websocket notification
      getIO().to(payload.equipmentId).emit("ai-telemetry-update", payload);

      // Tell RABBITMQ the task is done
      channel.ack(msg);
    } catch (error) {
      logger.error(`[WORKER] Failed processing AI Alert: ${error.message}`);

      // Negative Acknowledgement so that message are returned to the queue if the database system goed down
      channel.nack(msg, false, true);
    }
  });
};
