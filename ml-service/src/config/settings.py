import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_PATH)


class Settings:
    # SERVER CONFIGURATION
    PROJECT_NAME: str = "PREDICTIVE MAINTENANCE ML SERVICE"
    PROJECT_DESCRIPTION: str = "Microservice AI for Anomaly Detection Real Time"
    VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))

    # MACHINE LEANRNING MODELS CONFIGURATIOn
    MODEL_DIR: Path = BASE_DIR / "src" / "ml_engine" / "models"
    ANOMALY_MODEL: Path = MODEL_DIR / "anomaly_pipeline.pkl"

    RUL_MODEL: Path = MODEL_DIR / "rul_lstm.keras"
    RUL_SCALER: Path = MODEL_DIR / "rul_scaler.pkl"

    # RABBITMQ CONFIGURATIOn
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL", "")
    CONSUME_QUEUE: str = os.getenv("QUEUE_NAME", "sensor_data")
    PUBLISH_QUEUE: str = os.getenv("PUBLISH_QUEUE", "anomaly_alerts")

    # MONGODB CONFIGURATION
    MONGO_URI: str = os.getenv("MONGO_URI", "")
    TELEMETRY_COLLECTION: str = os.getenv("TELEMETRY_COLLECTION")
    PREDICTION_COLLECTION: str = os.getenv("PREDICTION_COLLECTION")

    def __init__(self):
        if not self.MONGO_URI:
            raise ValueError("MONGO_URI environment variable is not set")

        if not self.RABBITMQ_URL:
            raise ValueError("RABBITMQ_URL environment variable is not set")


settings = Settings()
