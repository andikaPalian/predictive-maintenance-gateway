import logging
import uvicorn
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from src.workers.consumer import TelemetryConsumer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("FastAPI_Main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ml-service")

    consumer = TelemetryConsumer()
    rabbitmq_connection = None

    try:
        rabbitmq_connection = await consumer.start_consuming()
        logger.info("Background Worker RabbitMQ started successfully")
    except Exception as e:
        logger.critical(f"Failed connecting to RabbitMQ : {str(e)}", exc_info=True)

    # Save connection to 'State' app FastAPI
    yield {"rmq_conn": rabbitmq_connection}

    # SHUTDOWN: GRACEFUl SHUTDOWN
    logger.info("Receive a shutdown signal. Safely closing the RabbitMQ connection")
    if rabbitmq_connection and not rabbitmq_connection.is_closed:
        await rabbitmq_connection.close()
        logger.info("RabbitMQ connection closed")


app = FastAPI(
    title="Predictive Maintenance ML Service",
    description="Microservice AI for Anomaly Detection Real Time",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def heal_check(request: Request):
    conn = request.state.rmq_conn

    return {
        "service": "ML Anomaly Engine",
        "status": "HEALTH",
        "rabbitmq_status": (
            "Connected" if conn and not conn.is_closed else "Disconnected"
        ),
    }


if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
