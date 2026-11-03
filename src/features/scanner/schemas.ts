import { z } from "zod";

export const cardDesignSchema = z.object({
  dominantColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Invalid hex color"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Invalid hex color").optional(),
  textColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "Invalid hex color"),
  styleTheme: z.enum(["dark", "light", "colorful"]).optional(),
});

export const saveScannedLeadSchema = z.object({
  profileId: z.string().uuid("Invalid profile ID"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  company: z.string().trim().max(100).optional().nullable(),
  jobTitle: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  website: z.string().trim().max(255).optional().nullable().or(z.literal("")),
  address: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  cardDesign: cardDesignSchema.optional().nullable(),
  cardImageBase64: z.string().optional().nullable(),
});

export type SaveScannedLeadInput = z.infer<typeof saveScannedLeadSchema>;
