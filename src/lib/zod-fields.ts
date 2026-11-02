import { z } from "zod";

import { toInternationalDigits } from "./phone";

// Optional form fields shared by profile and lead forms. Blank input becomes null.
// Error messages are i18n keys under `Validation`, resolved in the form UI.

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .transform((value) => value || null);

export const optionalPhone = z
  .string()
  .trim()
  .max(20, "tooLong")
  .refine((value) => !value || toInternationalDigits(value) !== null, "invalidPhone")
  .transform((value) => value || null);

export const optionalUrl = z
  .string()
  .trim()
  .max(2048, "tooLong")
  .refine(
    (value) => !value || z.url({ protocol: /^https?$/ }).safeParse(value).success,
    "invalidUrl",
  )
  .transform((value) => value || null);

export const optionalEmail = z
  .string()
  .trim()
  .max(254, "tooLong")
  .refine((value) => !value || z.email().safeParse(value).success, "invalidEmail")
  .transform((value) => value || null);
