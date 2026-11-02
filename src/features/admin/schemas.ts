import { z } from "zod";

import { slugSchema } from "@/features/profiles/schemas";

export const MAX_BATCH_QUANTITY = 1000;
export const CARDS_PAGE_SIZE = 50;

export const createBatchSchema = z.object({
  name: z.string().trim().min(1, "required").max(100, "tooLong"),
  quantity: z.coerce
    .number<string | number>()
    .int("invalid")
    .min(1, "invalid")
    .max(MAX_BATCH_QUANTITY, "invalid"),
  notes: z
    .string()
    .trim()
    .max(1000, "tooLong")
    .transform((value) => value || null),
});

export type CreateBatchInput = z.input<typeof createBatchSchema>;
export type CreateBatchValues = z.output<typeof createBatchSchema>;

// Query string of /admin/cards. Unknown or malformed values fall back to "no filter".
export const cardFilterSchema = z.object({
  status: z.enum(["unclaimed", "active", "disabled"]).optional().catch(undefined),
  batch: z.uuid().optional().catch(undefined),
  q: z
    .string()
    .trim()
    .toUpperCase()
    .max(8)
    .optional()
    .catch(undefined)
    .transform((value) => value || undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export type CardFilter = z.output<typeof cardFilterSchema>;

export const reassignSchema = z.object({ cardId: z.uuid(), slug: slugSchema });

export const ADMIN_ROLES = ["admin", "user"] as const;
