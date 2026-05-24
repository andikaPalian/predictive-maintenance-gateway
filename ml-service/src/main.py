import uvicorn
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from src.workers.consumer import TelemetryConsumer
from src.utils.logger import configure_logging, get_logger
from src.config.settings import settings

configure_logging()
logger = get_logger("FastAPI_Main")


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
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.VERSION,
    lifespan=lifespan,
)


@app.get("/health")
async def heal_check(request: Request):
    conn = request.state.rmq_conn

    return {
        "service": "ML Predictive Maintenance Engine (Anomaly & RUL)",
        "status": "HEALTH",
        "rabbitmq_status": (
            "Connected" if conn and not conn.is_closed else "Disconnected"
        ),
    }


if __name__ == "__main__":
    uvicorn.run("src.main:app", host=settings.HOST, port=settings.PORT, reload=True)
