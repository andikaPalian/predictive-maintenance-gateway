import os
import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import joblib
from src.utils.logger import get_logger
from src.config.settings import settings

# Logging
logger = get_logger("AnomalyDetectorTrainer")


class AnomalyDetectorTrainer:
    def __init__(self):
        self.mongo_uri = settings.MONGO_URI
        self.collection_name = settings.TELEMETRY_COLLECTION
        self.model_save_dir = settings.MODEL_DIR

        # Hyperparameter
        self.contamination = 0.1
        self.n_estimators = 150

    async def fetch_data(self) -> pd.DataFrame:
        logger.info("Opening a secure connection to MongoDB")

        # Connect to MongoDB
        client = AsyncIOMotorClient(self.mongo_uri)

        # Get the database from URI
        db = client.get_default_database()
        collection = db[self.collection_name]

        logger.info(f"Fetching data from {self.collection_name}...")
        cursor = collection.find({})
        raw_data = await cursor.to_list(length=None)

        client.close()

        if not raw_data:
            logger.error("Data is empty! Make sure the simulator has MongoDB loaded.")
            raise ValueError("Database Telemetry is empty")

        logger.info(f"Succesfully fetching {len(raw_data)} row data from telemetry")
        return pd.DataFrame(raw_data)

    def preprocessing_data(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("Starting feature extraction (Data Preprocessing)")

        feature = []
        for _, row in df.iterrows():
            if isinstance(row.get("metrics"), dict):
                metrics = row["metrics"]
                feature.append(
                    {
                        "temperature": metrics.get("temperature"),
                        "vibration": metrics.get("vibration"),
                        "rpm": metrics.get("rpm"),
                    }
                )

        processed_df = pd.DataFrame(feature)

        # Clean Missing Value
        initial_count = len(processed_df)
        processed_df = processed_df.dropna()
        final_count = len(processed_df)

        if initial_count != final_count:
            logger.warning(
                f"Found {initial_count - final_count} invalid rows (NaN). Removed"
            )

        return processed_df

    def train_pipeline(self, X: pd.DataFrame) -> Pipeline:
        logger.info("Building Machine Learning Pipeline (Scaler + Isolation Forest)")

        # Use pipeline to combine nomalitation phase and training
        ml_pipeline = Pipeline(
            [
                ("scaler", StandardScaler()),
                (
                    "anomaly_detector",
                    IsolationForest(
                        n_estimators=self.n_estimators,
                        contamination=self.contamination,
                        random_state=42,
                        n_jobs=-1,
                    ),
                ),
            ]
        )

        logger.info("Starting model training with Isolation Forest Algorithm")
        ml_pipeline.fit(X)

        logger.info("Retesting the training data (Sanity Check)")
        predictions = ml_pipeline.predict(X)
        anomalies_count = (predictions == -1).sum()
        normal_count = (predictions == 1).sum()

        logger.info("EVALUATION MODEL RESULT")
        logger.info(f"Total Healty Machine (Normal): {normal_count} data")
        logger.info(f"Total Damage Machine (Anomaly): {anomalies_count} data")

        return ml_pipeline

    def save_artifact(self, pipeline: Pipeline):
        os.makedirs(self.model_save_dir, exist_ok=True)

        # Save in one file
        filename = "anomaly_pipeline.pkl"
        filepath = os.path.join(self.model_save_dir, filename)

        joblib.dump(pipeline, filepath)
        logger.info(f"Artifact saved: AI pipeline saved to {filepath}")

    async def execute(self):
        try:
            logger.info("Starting Machine Learning Training Pipeline")

            raw_df = await self.fetch_data()

            clean_df = self.preprocessing_data(raw_df)

            trained_pipeline = self.train_pipeline(clean_df)

            self.save_artifact(trained_pipeline)

            logger.info("Training process completed successfully")
        except Exception as e:
            logger.critical(f"Critical Error: {str(e)}", exc_info=True)


if __name__ == "__main__":
    trainer = AnomalyDetectorTrainer()
    asyncio.run(trainer.execute())
