import os
import joblib
import pandas as pd
from src.utils.logger import get_logger

# Logging
logger = get_logger("AnomalyPredictor")


class AnomalyPredictor:
    def __init__(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "models", "anomaly_pipeline.pkl")

        try:
            logger.info(f"Loading model from {model_path}")
            self.model = joblib.load(model_path)
            logger.info("Model loaded successfully")
        except FileNotFoundError:
            logger.critical(f"Model not found at {model_path}")
            raise RuntimeError(
                "Model not found, Make sure the training process has done"
            )

    def predict(self, temperature: float, vibration: float, rpm: float) -> dict:
        try:
            input_data = pd.DataFrame(
                [
                    {
                        "temperature": float(temperature),
                        "vibration": float(vibration),
                        "rpm": float(rpm),
                    }
                ]
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
