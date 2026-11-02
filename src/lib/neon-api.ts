import "server-only";

import { env } from "@/lib/env";

const NEON_API = "https://console.neon.tech/api/v2";

export function isNeonApiConfigured(): boolean {
  return Boolean(env.NEON_API_KEY && env.NEON_PROJECT_ID && env.NEON_BRANCH_ID);
}

// Neon Auth doesn't let users delete themselves, so the server does it through the Neon API
// (the same call as `neon neon-auth user delete`). Deleting the auth user cascades in Postgres
// to everything that references it: profiles, links, taps and leads.
export async function deleteAuthUser(userId: string): Promise<boolean> {
  if (!isNeonApiConfigured()) return false;
  const path = `/projects/${env.NEON_PROJECT_ID}/branches/${env.NEON_BRANCH_ID}/auth/users/${encodeURIComponent(userId)}`;
  const response = await fetch(`${NEON_API}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${env.NEON_API_KEY}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("[neon-api] delete auth user failed", response.status, await response.text());
  }
  return response.ok;
}
