import "server-only";

import { z } from "zod";

// Server-side env, validated once at boot. Neon vars come from `neon deploy` / `neon env pull`.
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  DATABASE_URL: z.url(),
  NEON_AUTH_BASE_URL: z.url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_ENDPOINT_URL_S3: z.url(),
  AWS_REGION: z.string().min(1),
});

export const env = serverEnvSchema.parse(process.env);
