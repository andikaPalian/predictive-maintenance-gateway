import { z } from "zod";

const severityEnum = z.enum(["INFO", "WARNING", "CRITICAL"], {
  errorMap: () => ({ message: "Severity not valid. Valid values: INFO, WARNING, CRITICAL" }),
});

export const createAlertSchema = z.object({
  body: z.object({
    equipmentId: z.string().uuid("Invalid UUID format for Equipment ID"),
    message: z.string().min(5, "Message at least 5 characters long"),
    severity: severityEnum,
  }),
});

export const getAlertQuerySchema = z.object({
  query: z.object({
    skip: z.coerce.number().min(0, "Skip must be a non-negative integer").default(0),
    limit: z.coerce.number().min(1).max(100, "Limit must be between 1 and 100").default(100),
    equipmentId: z.string().uuid("Invalid UUID format for Equipment ID").optional(),
    severity: severityEnum.optional(),
    isAcknowledged: z
      .enum(["true", "false"], {
        errorMap: () => ({
          message: "isAcknowledged must be a ture or false",
        }),
      })
      .transform((val) => val === "true")
      .optional(),
  }),
});

export const alertIdParamSchema = z.object({
  params: z.object({
    alertId: z.string().uuid("Invalid UUID format for Alert ID"),
  }),
});
