import os
import joblib
import warnings
import numpy as np
import pandas as pd
from keras.models import load_model
from src.utils.logger import get_logger
from src.config.settings import settings

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# Logging
logger = get_logger("AnomalyPredictor")


class AnomalyPredictor:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_path = os.path.join(base_dir, "models", "anomaly_pipeline.pkl")

        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            logger.info(f"Loading Anomaly model from {self.model_path}")
            self.model = joblib.load(self.model_path)
            logger.info("Anomaly model loaded successfully")
        except FileNotFoundError:
            logger.critical(f"Model not found as {self.model_path}")
            raise RuntimeError("Anomaly model not found. Ensure training is done.")

    def predict(self, temperature: float, vibration: float, rpm: float) -> dict:
        if self.model is None:
            return {"success": False, "error_message": "Model not loaded"}

        try:
            input_data = pd.DataFrame(
                [[float(temperature), float(vibration), float(rpm)]],
                columns=["temperature", "vibration", "rpm"],
            )

            prediction = self.model.predict(input_data)[0]
            is_anomaly = True if prediction == -1 else False

            return {
                "success": True,
                "is_anomaly": is_anomaly,
                "status": "WARNING" if is_anomaly else "HEALTHY",
                "metrics_analyzed": {
                    "temperature": temperature,
                    "vibration": vibration,
                    "rpm": rpm,
                },
            }
        except Exception as e:
            logger.error(f"Failed to predict: {str(e)}", exc_info=True)
            return {"success": False, "error_message": str(e)}


class RULPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.sequence_length = 50
        self._load_artifact()

    def _load_artifact(self):
        try:
            if not os.path.exists(settings.RUL_MODEL) or not os.path.exists(
                settings.RUL_SCALER
            ):
                logger.warning(
                    "the LSTM Artifact is incomplete. Please run RUL training first"
                )
                return

            logger.info(f"Loading LSTM model from {settings.RUL_MODEL}")
            self.model = load_model(settings.RUL_MODEL)

            logger.info(f"Loading LSTM scaler from {settings.RUL_SCALER}")
            self.scaler = joblib.load(settings.RUL_SCALER)

            logger.info("LSTM model and scaler loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load artifact: {str(e)}", exc_info=True)
            raise RuntimeError("Failed to load RUL Artifact")

    def predict(self, sequence_data: list) -> dict:
        if self.model is None or self.scaler is None:
            return {"success": False, "error_message": "Model/Scaler not loaded"}

        if len(sequence_data) != self.sequence_length:
            return {
                "success": False,
                "error_message": f"Sequence must be excacly {self.sequence_length}",
            }

        try:
            # Change to array numpy
            seq_array = np.array(sequence_data)

            # Scale the data using Scaler from the training period
            scaled_seq = self.scaler.transform(seq_array)

            # Reshape to 3D tensor (1 sample, 50 timestamps, 3 features)
            reshaped_seq = np.expand_dims(scaled_seq, axis=0)

            # Make a prediction
            prediction = self.model.predict(reshaped_seq, verbose=0)
            rul_value = float(prediction[0][0])

            # Make sure RUL is not minus (machine dead)
            rul_value = max(0.0, rul_value)

            return {
                "success": True,
                "rul_value": round(rul_value, 2),
                "status": "CRITICAL" if rul_value < 50 else "HEALTHY",
            }
        except Exception as e:
            logger.error(f"Failed to predict RUL: {str(e)}", exc_info=True)
            return {"success": False, "error_message": str(e)}
