import { z } from "zod";

export const emailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("invalidEmail")),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "invalidOtp"),
});

// Only same-site relative paths are allowed as post-login destinations.
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
