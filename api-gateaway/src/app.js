import express from "express";
import "dotenv/config";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { connectDb } from "./config/mongo.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import startTelemetryRetryWorker from "./workers/telemetryRetry.worker.js";
import { telemetryRouter } from "./modules/telemetry/telemetry.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import logger from "./utils/logger.js";
import { equipmentRouter } from "./modules/equipment/equipment.routes.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "API Gateway is healthy" });
});

app.use("/api/telemetry", telemetryRouter);
app.use("/api/equipments", equipmentRouter);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDb();
    await connectRabbitMQ();
    startTelemetryRetryWorker();

    app.listen(port, () => {
      logger.info(`API Gateway is running on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
