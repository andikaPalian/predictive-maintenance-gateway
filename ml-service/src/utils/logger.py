import os
import logging
from logging.handlers import RotatingFileHandler


# Configure global handler apps
# Log will print to Terminal and saved to file
def configure_logging():
    # Cek folder logs
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Format logs standarization
    log_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    formatter = logging.Formatter(fmt=log_format, datefmt=date_format)

    # Print to terminal
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)

    # Save to file with auto rotate feature
    log_file_path = os.path.join(log_dir, "ml_service.log")
    file_handler = RotatingFileHandler(
        filename=log_file_path,
        maxBytes=5 * 1024 * 1024,
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)

    # Register handler to root folder
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Prevent double printing of logs if configure_logging is called more than once
    if not root_logger.handlers:
        root_logger.addHandler(console_handler)
        root_logger.addHandler(file_handler)


# Helper function to get logger instance on every file
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
