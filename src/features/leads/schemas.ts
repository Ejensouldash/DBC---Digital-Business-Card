import { z } from "zod";

import { optionalEmail, optionalPhone, optionalText } from "@/lib/zod-fields";

// Error messages are i18n keys under `Validation`, resolved in the form UI.
export const leadFormSchema = z
  .object({
    name: z.string().trim().min(1, "required").max(100, "tooLong"),
    phone: optionalPhone,
    email: optionalEmail,
    company: optionalText(100),
    message: optionalText(1000),
    consent: z.boolean().refine((given) => given, "consentRequired"),
    // Honeypot: hidden from people, but bots tend to fill in every field.
    fax: z.string().max(200, "tooLong"),
  })
  .refine((lead) => lead.phone || lead.email, { message: "contactRequired", path: ["phone"] });

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormValues = z.output<typeof leadFormSchema>;
