import mongoose from "mongoose";

const outboxSchema = new mongoose.Schema({
  payload: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400,
  },
});

const TelemetryOutbox = mongoose.model("TelemetryOutbox", outboxSchema);

export default TelemetryOutbox;
