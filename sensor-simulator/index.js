import axios from "axios";

const API_URL = "http://localhost:3000/api/telemetry";

const machines = {
  "ca7ba4f5-2a31-49e8-af53-4681422bd0cf": {
    name: "Turbin Utama",
    maxCycle: 500,
    cycle: 0,
    baseTemp: 60,
    baseVib: 2,
    rpm: 2400,
    maxIncTemp: 60,
    maxIncVib: 25,
  },
  "70dee873-af63-4376-9e20-e76c0042ba69": {
    name: "Pompa Air",
    maxCycle: 800,
    cycle: 0,
    baseTemp: 40,
    baseVib: 1.5,
    rpm: 1800,
    maxIncTemp: 50,
    maxIncVib: 15,
  },
  "f544a7c5-23cf-4c02-a087-4df070cfae27": {
    name: "Kamera YOLO",
    maxCycle: 600,
    cycle: 0,
    baseTemp: 35,
    baseVib: 1,
    rpm: 1200,
    maxIncTemp: 40,
    maxIncVib: 10,
  },
};

const addNoise = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const generateUnifiedData = (eqId) => {
  const machine = machines[eqId];
  machine.cycle += 1;

  // 1. Hitung Pola Penuaan Normal (Untuk LSTM)
  const degradationRatio = Math.pow(machine.cycle / machine.maxCycle, 2);
  let temp = machine.baseTemp + degradationRatio * machine.maxIncTemp + addNoise(-2, 2);
  let vib = machine.baseVib + degradationRatio * machine.maxIncVib + addNoise(-0.5, 0.5);
  let rpm = machine.rpm + addNoise(-50, 50);

  // 2. Suntikkan Kejadian Langka (5% Peluang Anomali Tiba-tiba untuk Isolation Forest)
  const isSuddenAnomaly = Math.random() < 0.05;
  if (isSuddenAnomaly) {
    temp = temp + addNoise(40, 80); // Suhu tiba-tiba melonjak 40-80 derajat!
    vib = vib + addNoise(10, 20);
    rpm = rpm - addNoise(500, 1000); // RPM tiba-tiba drop
  }

  // 3. Reset jika mesin sudah batas umur (Maintenance Rutin)
  if (machine.cycle >= machine.maxCycle) {
    console.log(`\n🔧 MAINTENANCE RUTIN: ${machine.name.toUpperCase()} selesai diperbaiki. 🔧\n`);
    machine.cycle = 0;
  }

  return {
    payload: {
      equipmentId: eqId,
      status: "ONLINE",
      metrics: {
        temperature: parseFloat(temp.toFixed(2)),
        vibration: parseFloat(vib.toFixed(2)),
        rpm: parseFloat(rpm.toFixed(2)),
      },
    },
    isAnomalyTarget: isSuddenAnomaly, // Hanya sebagai penanda visual di console
  };
};

const runSimulator = () => {
  console.log("🏭 Enterprise IoT Simulator (Unified Mode) Berjalan...");
  console.log("📡 Mengirim data stream ke API Gateway... \n");

  const machineIds = Object.keys(machines);

  setInterval(async () => {
    const eqId = machineIds[Math.floor(Math.random() * machineIds.length)];
    const data = generateUnifiedData(eqId);
    const machineName = machines[eqId].name;

    try {
      const response = await axios.post(API_URL, data.payload);

      // Visualisasi Log di Terminal
      if (data.isAnomalyTarget) {
        console.log(
          `🚨 [ANOMALI!] ${machineName} | Temp Melonjak: ${data.payload.metrics.temperature}°C`,
        );
      } else {
        let icon = "✅";
        if (
          data.payload.metrics.temperature >
          machines[eqId].baseTemp + machines[eqId].maxIncTemp * 0.7
        )
          icon = "⚠️";
        console.log(
          `${icon} [NORMAL] ${machineName} | Usia: ${machines[eqId].cycle} | Temp: ${data.payload.metrics.temperature}°C`,
        );
      }
    } catch (error) {
      console.error(`❌ Gagal: ${error.response?.data?.message || error.message}`);
    }
  }, 300); // Tembak tiap 300ms
};

runSimulator();
