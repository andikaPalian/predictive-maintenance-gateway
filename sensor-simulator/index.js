import axios from "axios";

const API_URL = process.env.API_URL;

const VALID_UUIDS = [
  "58a610b1-0f1e-4850-b9d2-2b6f20857227",
  "0cc42c69-1a56-4a04-9001-27b0a424cb73",
  "9d934f9c-d657-4340-b1f5-69807a799dcb",
];

const getRandomInRange = (min, max) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
};

const generateTelemetryData = (equipmentId) => {
  const isAnomaly = Math.random() < 0.9;

  return {
    equipmentId: equipmentId,
    status: "ONLINE",
    metrics: {
      temperature: isAnomaly ? getRandomInRange(100, 125) : getRandomInRange(6, 80),
      vibration: isAnomaly ? getRandomInRange(20, 35) : getRandomInRange(2, 8),
      rpm: isAnomaly ? getRandomInRange(4000, 5000) : getRandomInRange(1000, 2400),
    },
  };
};

const runSimulator = () => {
  console.log("Simulator IOT Berjalan...");
  console.log("Mengirim data ke API Gateway... \n");

  setInterval(async () => {
    const eqId = VALID_UUIDS[Math.floor(Math.random() * VALID_UUIDS.length)];
    const payload = generateTelemetryData(eqId);

    try {
      const response = await axios.post(API_URL, payload);

      const icon = payload.metrics.temperature > 90 ? "⚠️" : "✅";
      console.log(`${icon} [${response.status}] Sent data for ${eqId.substring(0, 8)}...`);
    } catch (error) {
      console.error(`❌ Gagal: ${error.response?.data?.message || error.message}`);
    }
  }, 1000);
};

runSimulator();
