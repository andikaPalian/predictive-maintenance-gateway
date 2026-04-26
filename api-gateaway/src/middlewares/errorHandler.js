import { AppError } from "../utils/error.js";
import logger from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Development Error Handler
  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      stack: err.stack,
    });
  }

  // Production Error Handler
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  } else {
    logger.error(
      `[FATAL 500] ${err.message} - Path: ${req.originalUrl} - Method: ${req.method} - IP: ${req.ip}\nStack: ${err.stack}`,
    );
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
