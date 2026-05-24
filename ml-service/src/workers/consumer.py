import json
import asyncio
import aio_pika
from collections import deque
from src.ml_engine.predictor import AnomalyPredictor, RULPredictor
from src.database.mongo_dao import MongoDAO
from src.utils.logger import get_logger
from src.config.settings import settings

logger = get_logger("RabbitMQConsumer")


class TelemetryConsumer:
    def __init__(self):
        self.rabbitmq_url = settings.RABBITMQ_URL
        self.consume_queue = settings.CONSUME_QUEUE
        self.publish_queue = settings.PUBLISH_QUEUE
        self.anomaly_predictor = AnomalyPredictor()
        self.rul_predictor = RULPredictor()
        self.mongo_dao = MongoDAO()
        self.connection = None
        self.channel = None
        self.sensor_buffer = {}

    async def process_message(self, message: aio_pika.abc.AbstractIncomingMessage):
        async with message.process():
            try:
                body = json.loads(message.body.decode("utf-8"))
                equipment_id = body.get("equipmentId", "UNKNOWN_ID")
                metrics = body.get("metrics", {})

                temperature = metrics.get("temperature", 0.0)
                vibration = metrics.get("vibration", 0.0)
                rpm = metrics.get("rpm", 0.0)

                anomaly_result = await asyncio.to_thread(
                    self.anomaly_predictor.predict, temperature, vibration, rpm
                )

                if equipment_id not in self.sensor_buffer:
                    self.sensor_buffer[equipment_id] = deque(maxlen=50)

                self.sensor_buffer[equipment_id].append([temperature, vibration, rpm])

                rul_result = None
                rul_value = -1.0

                if len(self.sensor_buffer[equipment_id]) == 50:
                    sequence = list(self.sensor_buffer[equipment_id])
                    rul_result = await asyncio.to_thread(
                        self.rul_predictor.predict, sequence
                    )

                    if rul_result.get("success"):
                        rul_value = rul_result.get("rul_value")

                unified_predictions = {
                    "is_anomaly": anomaly_result.get("is_anomaly", False),
                    "anomaly_status": anomaly_result.get("status", "HEALTHY"),
                    "rul_value": rul_value,
                    "rul_status": (
                        rul_result.get("status", "HEALTHY") if rul_result else "PENDING"
                    ),
                }

                await self.mongo_dao.save_prediction(
                    equipment_id=equipment_id,
                    metrics={
                        "temperature": temperature,
                        "vibration": vibration,
                        "rpm": rpm,
                    },
                    prediction_result=unified_predictions,
                )

                if anomaly_result.get("is_anomaly"):
                    logger.warning(
                        f"DANGER! Anomaly detected on Machine {equipment_id[:8]}."
                        f"Temperature: {temperature}°C, Vibration: {vibration}, RPM: {rpm}"
                    )

                is_danger = anomaly_result.get("is_anomaly", False)
                alert_payload = {
                    "equipmentId": equipment_id,
                    "severity": "CRITICAL" if is_danger else "INFO",
                    "message": (
                        f"AI ML ENGINE detect critical anomaly! Temperature: {temperature}°C, Vibration: {vibration}, RPM: {rpm}"
                        if is_danger
                        else f"AI Engine Update. RUL: {rul_value if rul_value != -1.0 else 'Calculating'} cycles"
                    ),
                    "metrics": metrics,
                    "timestamps": body.get("timestamp"),
                    "ai_analysis": unified_predictions,
                }

                if self.channel:
                    await self.channel.default_exchange.publish(
                        aio_pika.Message(
                            body=json.dumps(alert_payload).encode("utf-8"),
                            content_type="application/json",
                        ),
                        routing_key=self.publish_queue,
                    )

                if rul_value != -1.0:
                    logger.info(
                        f"[NORMAL] {equipment_id[:8]} | RUL: {rul_value} | Temp: {temperature} | Vib: {vibration} | RPM: {rpm}"
                    )
                else:
                    logger.debug(
                        f"Collectiong data {equipment_id[:8]}... ({len(self.sensor_buffer[equipment_id])}/50)"
                    )
            except Exception as e:
                logger.error(
                    f"Failed to process telemetry message: {str(e)}", exc_info=True
                )

    async def start_consuming(self):
        logger.info(f"Menghubungkan ke RabbitMQ di {self.rabbitmq_url}")

        self.connection = await aio_pika.connect_robust(self.rabbitmq_url)
        self.channel = await self.connection.channel()

        # RAM PROTECTION
        # ONLY TAKE MAX 10 QUEUE AT A TIME
        # Prevents workers from choking if millions of messages suddenly come in.
        await self.channel.set_qos(prefetch_count=10)

        queue = await self.channel.declare_queue(self.consume_queue, durable=True)

        logger.info(f"Worker ready! Listen queue '{self.consume_queue}'")

        await queue.consume(self.process_message)

        return self.connection
