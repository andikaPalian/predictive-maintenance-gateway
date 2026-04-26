import { z } from "zod";

export const createTelemetrySchema = z.object({
  equipmentId: z
    .string({
      required_error: "Equipment ID is required",
    })
    .uuid("Invalid UUID format for Equipment ID"),

  metrics: z.object(
    {
      temperature: z.coerce
        .number({
          required_error: "Temperature is required and must be a number",
        })
        .min(-50, "Temperature under -50°C is not realistic")
        .max(2000, "Temperature over 2000°C is not realistic"),

      vibration: z.coerce
        .number({ required_error: "Vibration is required and must be a number" })
        .nonnegative("Vibration cannot be negative"),

      rpm: z.coerce.number().nonnegative("RPM cannot be negative").optional(),
    },
    { required_error: "Metrics object is required" },
  ),

  status: z.enum(["ONLINE", "OFFLINE", "ERROR"]).default("ONLINE"),
});
