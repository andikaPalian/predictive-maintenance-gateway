import express from "express";
import "dotenv/config";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import { connectDb } from "./config/mongo.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const app = express();
const port = process.env.PORT || 3000;
await connectDb();
await connectRabbitMQ();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "API Gateway is healthy" });
});

app.listen(port, () => {
  console.log(`Server is running on  http://localhost:${port}`);
});
