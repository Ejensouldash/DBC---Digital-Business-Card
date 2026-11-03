import "server-only";

import { z } from "zod";

// Automatically detect Vercel production domain if NEXT_PUBLIC_SITE_URL is left as localhost or unset in production
const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_SITE_URL;

// Server-side env, validated once at boot. Neon vars come from `neon deploy` / `neon env pull`.
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  DATABASE_URL: z.url(),
  NEON_AUTH_BASE_URL: z.url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
  // Cloudflare R2 bucket for profile images. Optional so the app boots without it; images are
  // hidden and uploads fail with a clear error until all five are set.
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET: z.string().min(1).optional(),
  // Public base URL: https://pub-<hash>.r2.dev, or your custom domain in production.
  R2_PUBLIC_URL: z.url().optional(),
  // Shown on the privacy notice for PDPA requests (access, correction, withdrawing consent).
  CONTACT_EMAIL: z.email().optional(),
  // Neon API access, used only to delete a user's Neon Auth account (Settings > Delete account).
  // Optional so the app still boots without it; account deletion is unavailable until it's set.
  NEON_API_KEY: z.string().min(1).optional(),
  NEON_PROJECT_ID: z.string().min(1).optional(),
  NEON_BRANCH_ID: z.string().startsWith("br-").optional(),
});

export const env = serverEnvSchema.parse({
  ...process.env,
  NEXT_PUBLIC_SITE_URL: rawSiteUrl,
});
