import os
import asyncio
import numpy as np
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient
from sklearn.preprocessing import StandardScaler
import joblib

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from keras.models import Sequential
from keras.layers import LSTM, Dense, Dropout
from keras.callbacks import EarlyStopping

from src.utils.logger import configure_logging, get_logger
from src.config.settings import settings

logger = get_logger("RULTrainer")


class RULTrainer:
    def __init__(self):
        self.mongo_uri = settings.MONGO_URI
        self.collection_name = settings.TELEMETRY_COLLECTION

        # Hyperparameters LSTM
        self.sequence_length = 50
        self.epochs = 100
        self.batch_size = 64

        # Object Scaler
        self.scaler = StandardScaler()

    async def fetch_historical_data(self) -> pd.DataFrame:
        logger.info("Opening a secure connection to MongoDB")

        client = AsyncIOMotorClient(self.mongo_uri)
        db = client.get_default_database()
        collection = db[self.collection_name]

        # Fetch data and sort by timestamps
        # Retrieve up to 100.000 latest data from database
        cursor = collection.find({}).sort("timestamp", 1).limit(100000)
        raw_data = await cursor.to_list(length=None)
        client.close()

        if not raw_data:
            raise ValueError("Database Telemetry is empty. Cannot train LSTM")

        # Restore the order to chronological (oldest to newest) after limiting
        raw_data.reverse()

        logger.info(f"Succesfully fetching {len(raw_data)} raw data from telemetry")

        # Convert to DataFrame
        # Flatten the metrics dictionary structure to the main column
        df = pd.json_normalize(raw_data)
        # Rename the normalized result column to make it neater
        df = df.rename(
            columns={
                "metrics.temperature": "temperature",
                "metrics.vibration": "vibration",
                "metrics.rpm": "rpm",
            }
        )

        return df[["equipmentId", "timestamp", "temperature", "vibration", "rpm"]]

    def prepare_sequences(self, df: pd.DataFrame):
        logger.info("Start feature extraction and sliding window formation")

        X_train, y_train, X_val, y_val = [], [], [], []
        features = ["temperature", "vibration", "rpm"]

        train_size_global = int(len(df) * 0.8)
        self.scaler.fit(df[features].iloc[:train_size_global])

        df[features] = self.scaler.transform(df[features])

        grouped = df.groupby("equipmentId")

        for equipment_id, group in grouped:
            group = group.reset_index(drop=True)
            max_cycle = len(group)

            if max_cycle < self.sequence_length:
                continue

            train_limit = int(max_cycle * 0.8)

            for i in range(max_cycle - self.sequence_length):
                sequence = group[features].iloc[i : i + self.sequence_length].values
                rul_label = max_cycle - (i + self.sequence_length)

                # If the data is in the past range (80%, set it to Training
                if i < train_limit:
                    X_train.append(sequence)
                    y_train.append(rul_label)
                # If the data is in the future (late 20%), make it Validation
                else:
                    X_val.append(sequence)
                    y_val.append(rul_label)

        X_train_arr, y_train_arr = np.array(X_train), np.array(y_train)
        X_val_arr, y_val_arr = np.array(X_val), np.array(y_val)

        logger.info(f"Training data shape: {X_train_arr.shape}")
        logger.info(f"Validation data shape: {X_val_arr.shape}")

        return X_train_arr, y_train_arr, X_val_arr, y_val_arr

    def build_and_train_model(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
    ):
        logger.info("Assembling the LSTM Neural Network Architecture")

        # Dimention input
        input_shape = (X_train.shape[1], X_train.shape[2])

        model = Sequential(
            [
                LSTM(64, return_sequences=True, input_shape=input_shape),
                Dropout(0.2),
                LSTM(32, return_sequences=False),
                Dropout(0.2),
                Dense(16, activation="relu"),
                Dense(1),
            ]
        )

        model.compile(optimizer="adam", loss="mse", metrics=["mse"])

        early_stop = EarlyStopping(
            monitor="val_loss", patience=10, restore_best_weights=True
        )

        logger.info("Starting model training")
        history = model.fit(
            X_train,
            y_train,
            epochs=self.epochs,
            batch_size=self.batch_size,
            validation_data=(X_val, y_val),
            callbacks=[early_stop],
            verbose=1,
        )

        logger.info("Training LSTM process completed successfully")
        return model

    def save_artifact(self, model):
        settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)

        model.save(settings.RUL_MODEL)
        logger.info(f"LSTM Model successfully saved at: {settings.RUL_MODEL}")

        joblib.dump(self.scaler, settings.RUL_SCALER)
        logger.info(f"Scaler successfully saved at: {settings.RUL_SCALER}")

    async def execute(self):
        try:
            logger.info("Starting RUL Pipeline Training (LSTM)")

            raw_df = await self.fetch_historical_data()
            X_train, y_train, X_val, y_val = self.prepare_sequences(raw_df)

            if len(X_train) == 0:
                logger.error(
                    "Insufficient data to create a sequence. Add telemetry data"
                )
                return

            trained_model = self.build_and_train_model(X_train, y_train, X_val, y_val)
            self.save_artifact(trained_model)

            logger.info("Pipeline training completed successfully")
        except Exception as e:
            logger.critical(f"Critical Error: {str(e)}", exc_info=True)


if __name__ == "__main__":
    configure_logging()

    trainer = RULTrainer()
    asyncio.run(trainer.execute())
