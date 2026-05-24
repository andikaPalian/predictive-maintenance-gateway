import mongoose from "mongoose";

const telemetrySchema = new mongoose.Schema(
  {
    equipmentId: {
      type: String,
      required: true,
      index: true,
      description: "Relating to UUID in PostgreSQL equipment table",
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    metrics: {
      temperature: {
        type: Number,
        required: true,
      },
      vibration: {
        type: Number,
        required: true,
      },
      rpm: {
        type: Number,
      },
    },
    status: {
      type: String,
      enum: ["ONLINE", "OFFLINE", "ERROR"],
      default: "ONLINE",
    },
  },
  {
    timeseries: {
      timeField: "timestamp",
      metaField: "equipmentId",
      granularity: "seconds",
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Telemetry = mongoose.model("Telemetry", telemetrySchema);

export default Telemetry;
