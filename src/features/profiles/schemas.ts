import { z } from "zod";

import { profileThemeSchema } from "@/lib/profile-theme";
import { optionalEmail, optionalPhone, optionalText, optionalUrl } from "@/lib/zod-fields";

import { RESERVED_SLUGS } from "./lib/reserved-slugs";

// Error messages are i18n keys under `Validation`, resolved in the form UI.
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "slugTooShort")
  .max(30, "slugTooLong")
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "slugFormat")
  .refine((slug) => !RESERVED_SLUGS.has(slug), "slugReserved");

export const profileFormSchema = z.object({
  slug: slugSchema,
  displayName: z.string().trim().min(1, "required").max(80, "tooLong"),
  jobTitle: optionalText(80),
  company: optionalText(100),
  bio: optionalText(500),
  phone: optionalPhone,
  whatsapp: optionalPhone,
  email: optionalEmail,
  website: optionalUrl,
  address: optionalText(300),
  mapsUrl: optionalUrl,
  isPublished: z.boolean(),
  allowIndexing: z.boolean(),
  leadFormEnabled: z.boolean(),
  theme: profileThemeSchema,
});

export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormValues = z.output<typeof profileFormSchema>;

// First profile, created while activating a card.
export const onboardingSchema = profileFormSchema.pick({
  displayName: true,
  slug: true,
  phone: true,
});

export type OnboardingInput = z.input<typeof onboardingSchema>;
export type OnboardingValues = z.output<typeof onboardingSchema>;

export const IMAGE_KINDS = ["avatar", "cover"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];
