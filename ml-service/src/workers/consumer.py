import os
import json
import logging
import asyncio
import aio_pika
from dotenv import load_dotenv
from src.ml_engine.predictor import AnomalyPredictor
from src.database.mongo_dao import MongoDAO

logger = logging.getLogger("RabbitMQConsumer")
load_dotenv()


class TelemetryConsumer:
    def __init__(self):
        self.rabbitmq_url = os.getenv("RABBITMQ_URL")
        self.consume_queue = os.getenv("QUEUE_NAME")
        self.publish_queue = "anomaly_alerts"
        self.predictor = AnomalyPredictor()
        self.mongo_dao = MongoDAO()
        self.connection = None
        self.channel = None

    async def process_message(self, message: aio_pika.abc.AbstractIncomingMessage):
        async with message.process():
            try:
                body = json.loads(message.body.decode("utf-8"))
                equipment_id = body.get("equipmentId", "UNKNOWN_ID")
                metrics = body.get("metrics", {})

                temperature = metrics.get("temperature", 0.0)
                vibration = metrics.get("vibration", 0.0)
                rpm = metrics.get("rpm", 0.0)

                prediction_result = await asyncio.to_thread(
                    self.predictor.predict, temperature, vibration, rpm
                )

                await self.mongo_dao.save_prediction(
                    equipment_id=equipment_id,
                    metrics={
                        "temperature": temperature,
                        "vibration": vibration,
                        "rpm": rpm,
                    },
                    prediction_result=prediction_result,
                )

                if prediction_result.get("is_anomaly"):
                    logger.warning(
                        f"DANGER! Anomaly detected on Machine {equipment_id}."
                        f"Temperature: {temperature}°C, Vibration: {vibration}, RPM: {rpm}"
                        f"Status: {prediction_result.get('status')}"
                    )

                    alert_payload = {
                        "equipmentId": equipment_id,
                        "severity": "CRITICAL",
                        "message": f"AI ML ENGINE detect critical anomaly! Temperature: {temperature}°C, Vibration: {vibration}, RPM: {rpm}",
                        "metrics": metrics,
                        "timestamps": body.get("timestamp"),
                    }

                    if self.channel:
                        await self.channel.default_exchange.publish(
                            aio_pika.Message(
                                body=json.dumps(alert_payload).encode("utf-8"),
                                content_type="application/json",
                            ),
                            routing_key=self.publish_queue,
                        )

                        logger.info(
                            f"Danger sign send to Node.js using queue '{self.publish_queue}'"
                        )
                else:
                    logger.info(f"Machine {equipment_id} is running normaly")
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
