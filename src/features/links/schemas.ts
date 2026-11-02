import { z } from "zod";

import { LINK_TYPES } from "@/lib/link-types";

// "instagram.com/siti" is accepted and stored as "https://instagram.com/siti".
const urlWithScheme = z
  .string()
  .trim()
  .min(1, "required")
  .max(2048, "tooLong")
  .transform((value) => (/^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`))
  .pipe(z.url({ protocol: /^https?$/, error: "invalidUrl" }));

export const linkFormSchema = z.object({
  type: z.enum(LINK_TYPES),
  label: z
    .string()
    .trim()
    .max(50, "tooLong")
    .transform((value) => value || null),
  url: urlWithScheme,
});

export type LinkFormInput = z.input<typeof linkFormSchema>;
export type LinkFormValues = z.output<typeof linkFormSchema>;

export const reorderSchema = z.array(z.uuid()).min(1).max(100);
