import os
import json
import logging
import asyncio
import aio_pika
from dotenv import load_dotenv
from src.ml_engine.predictor import AnomalyPredictor

logger = logging.getLogger("RabbitMQConsumer")
load_dotenv()


class TelemetryConsumer:
    def __init__(self):
        self.rabbitmq_url = os.getenv("RABBITMQ_URL")
        self.queue_name = os.getenv("QUEUE_NAME")
        self.predictor = AnomalyPredictor()

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

                if prediction_result.get("is_anomaly"):
                    logger.warning(
                        f"DANGER! Anomaly detected on Machine {equipment_id}."
                        f"Temperature: {temperature}°C, Vibration: {vibration}, RPM: {rpm}"
                        f"Status: {prediction_result.get('status')}"
                    )
                else:
                    logger.info(f"Machine {equipment_id} is running normaly")
            except Exception as e:
                logger.error(
                    f"Failed to process telemetry message: {str(e)}", exc_info=True
                )

    async def start_consuming(self):
        logger.info(f"Menghubungkan ke RabbitMQ di {self.rabbitmq_url}")

        connection = await aio_pika.connect_robust(self.rabbitmq_url)
        channel = await connection.channel()

        # RAM PROTECTION
        # ONLY TAKE MAX 10 QUEUE AT A TIME
        # Prevents workers from choking if millions of messages suddenly come in.
        await channel.set_qos(prefetch_count=10)

        queue = await channel.declare_queue(self.queue_name, durable=True)

        logger.info(f"Worker ready! Listen queue '{self.queue_name}'")

        await queue.consume(self.process_message)

        return connection
