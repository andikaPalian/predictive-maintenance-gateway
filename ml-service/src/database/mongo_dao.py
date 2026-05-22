import os
import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger("MongoDAO")


class MongoDAO:
    def __init__(self):
        self.mongo_uri = os.getenv("MONGO_URI")
        self.collection_name = "anomaly_predictions"

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
                "is_anomaly": prediction_result.get("is_anomaly", False),
                "status": prediction_result.get("status", "UNKNOWN"),
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
