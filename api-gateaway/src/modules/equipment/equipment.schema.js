import { z } from "zod";

export const createEquipmentSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required").max(255, "Name cannot exceed 255 characters"),
      type: z.string().min(1, "Type is required").max(255, "Type cannot exceed 255 characters"),
      location: z.string().max(255, "Location cannot exceed 255 characters").optional(),
      status: z.enum(["HEALTHY", "WARNING", "CRITICAL", "MAINTENANCE"]).default("HEALTHY"),
      installationDate: z
        .string()
        .datetime({
          message:
            "Format for installationDate must be ISO 8601 date-time string (e.g., '2024-01-01T00:00:00Z')",
        })
        .transform((val) => new Date(val))
        .optional(),
    })
    .strict("Payload contains unknown fields."),
});

export const updateEquipmentSchema = z.object({
  params: z.object({
    equipmentId: z.string().uuid("Invalid UUID format for Equipment ID"),
  }),
  body: z
    .object({
      name: z.string().min(1).max(255, "Name cannot exceed 255 characters").optional(),
      type: z.string().min(1).max(255, "Type cannot exceed 255 characters").optional(),
      location: z.string().max(255, "Location cannot exceed 255 characters").optional(),
      status: z.enum(["HEALTHY", "WARNING", "CRITICAL", "MAINTENANCE"]).optional(),
      installationDate: z
        .string()
        .datetime({
          message:
            "Format for installationDate must be ISO 8601 date-time string (e.g., '2024-01-01T00:00:00Z')",
        })
        .transform((val) => new Date(val))
        .optional(),
    })
    .strict("Payload contains unknown fields."),
});

export const getEquipmentQuerySchema = z.object({
  query: z.object({
    skip: z.coerce.number().min(0, "Skip must be a non-negative integer").default(0),
    limit: z.coerce.number().min(1).max(100, "Limit must be between 1 and 100").default(100),
  }),
});

export const equipmentIdParamSchema = z.object({
  params: z.object({
    equipmentId: z.string().uuid("Invalid UUID format for Equipment ID"),
  }),
});
