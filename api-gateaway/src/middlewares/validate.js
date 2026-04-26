import { AppError } from "../utils/error.js";

export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    const error = new AppError("Validation error", 400);
    error.errors = formattedErrors;

    return next(error);
  }

  req.body = result.data;

  next();
};
