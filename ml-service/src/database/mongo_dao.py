from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from src.utils.logger import get_logger
from src.config.settings import settings

logger = get_logger("MongoDAO")


class MongoDAO:
    def __init__(self):
        self.mongo_uri = settings.MONGO_URI
        self.collection_name = settings.PREDICTION_COLLECTION

        if not self.mongo_uri:
            raise RuntimeError("MONGO_URI environment variable is not set")

        self.client = AsyncIOMotorClient(self.mongo_uri)
        self.db = self.client.get_default_database()
        self.collection = self.db[self.collection_name]

    async def save_prediction(
        self, equipment_id: str, metrics: dict, prediction_result: dict
    ):
        try:
            document = {
                "equipmentId": equipment_id,
                "timestamp": datetime.now(timezone.utc),
                "metrics": metrics,
                "ai_analysis": {
                    "is_anomaly": prediction_result.get("is_anomaly", False),
                    "anomaly_status": prediction_result.get(
                        "anomaly_status", "UNKNOWN"
                    ),
                    "rul_value": prediction_result.get("rul_value", -1.0),
                    "rul_status": prediction_result.get("rul_status", "UNKNOWN"),
                },
            }

            result = await self.collection.insert_one(document)
            logger.info(
                f"AI result saved to MongoDB. Document ID: {result.inserted_id}"
            )

            return result.inserted_id
        except Exception as e:
            logger.error(
                f"Failed to save AI result to MongoDB: {str(e)}", exc_info=True
            )

            return None
