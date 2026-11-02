import "server-only";

import { createNeonAuth } from "@neon/auth/next/server";

import { env } from "@/lib/env";

// Managed Better Auth hosted by Neon. Users and sessions live in the `neon_auth` schema.
export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL,
  cookies: { secret: env.NEON_AUTH_COOKIE_SECRET },
});
