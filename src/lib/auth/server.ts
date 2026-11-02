import "server-only";

import { createNeonAuth } from "@neon/auth/next/server";

import { env } from "@/lib/env";

// Managed Better Auth hosted by Neon. Users and sessions live in the `neon_auth` schema.
export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL,
  cookies: { secret: env.NEON_AUTH_COOKIE_SECRET },
});

type AdminApi = {
  setRole(input: { userId: string; role: string }): Promise<{ error: unknown }>;
};

// The admin endpoints exist at runtime (the SDK builds them from its endpoint table) but
// @neon/auth 0.8 types the `admin` namespace as unknown. This is the one place we narrow it.
// The call is made with the signed-in admin's session; Neon Auth rejects anyone else.
export const authAdmin = (auth as unknown as { admin: AdminApi }).admin;
