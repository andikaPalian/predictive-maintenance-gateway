import sys
import logging


# Configure global handler apps
def configure_logging():
    # Format logs standarization
    log_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    date_format = "%Y-%m-%d %H:%M:%S"
    formatter = logging.Formatter(fmt=log_format, datefmt=date_format)

    # Print to terminal
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Register handler to root folder
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Prevent double printing of logs if configure_logging is called more than once
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    root_logger.addHandler(console_handler)

    # force the standar log server Uvicorn to use our handler
    logging.getLogger("uvicorn.access").handlers = [console_handler]
    logging.getLogger("uvicorn.error").handlers = [console_handler]


# Helper function to get logger instance on every file
def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
