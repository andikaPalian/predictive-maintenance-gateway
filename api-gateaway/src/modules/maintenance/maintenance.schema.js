import { z } from "zod";

export const createMaintenanceLogSchema = z.object({
  body: z
    .object({
      equipmentId: z.string().uuid("Invalid UUID format for equipmentId"),
      actionPerformed: z
        .string()
        .min(1, "Action performed is required")
        .max(255, "Action performed cannot exceed 255 characters"),
      performedBy: z
        .string()
        .min(1, "Performed by is required")
        .max(255, "Performed by cannot exceed 255 characters"),
      date: z
        .string()
        .datetime({
          message:
            "Format for date must be ISO 8601 date-time string (e.g., '2024-01-01T00:00:00Z')",
        })
        .transform((val) => new Date(val))
        .optional(),
    })
    .strict("Payload contains unknown fields."),
});

export const updateMaintenanceLogSchema = z.object({
  params: z.object({
    logId: z.string().uuid("Invalid UUID format for logId"),
  }),
  body: z
    .object({
      equipmentId: z.string().uuid("Invalid UUID format for equipmentId").optional(),
      actionPerformed: z
        .string()
        .min(1, "Action performed is required")
        .max(255, "Action performed cannot exceed 255 characters")
        .optional(),
      performedBy: z
        .string()
        .min(1, "Performed by is required")
        .max(255, "Performed by cannot exceed 255 characters")
        .optional(),
      date: z
        .string()
        .datetime({
          message:
            "Format for date must be ISO 8601 date-time string (e.g., '2024-01-01T00:00:00Z')",
        })
        .transform((val) => new Date(val))
        .optional(),
    })
    .strict("Payload contains unknown fields."),
});

export const getMaintenanceLogsQuerySchema = z.object({
  query: z.object({
    skip: z.coerce.number().min(0, "Skip must be a non-negative integer").default(0),
    limit: z.coerce.number().min(1).max(100, "Limit must be between 1 and 100").default(100),
    equipmentId: z.string().uuid("Invalid UUID format for equipmentId").optional(),
  }),
});

export const getMaintenanceLogIdParamSchema = z.object({
  params: z.object({
    logId: z.string().uuid("Invalid UUID format for logId"),
  }),
});
