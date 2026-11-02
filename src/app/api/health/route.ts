import { sql } from "drizzle-orm";
import { connection } from "next/server";

import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { checkBucket } from "@/lib/storage";

type CheckResult = { ok: true } | { ok: false; error: string };

async function run(check: () => Promise<unknown>): Promise<CheckResult> {
  try {
    await check();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unknown error" };
  }
}

// Read-only liveness check for Postgres, Object Storage and Neon Auth.
export async function GET() {
  await connection();

  const [database, storage, authService] = await Promise.all([
    run(() => db.execute(sql`select 1`)),
    run(checkBucket),
    run(async () => {
      const res = await fetch(`${env.NEON_AUTH_BASE_URL}/ok`, { cache: "no-store" });
      if (!res.ok) throw new Error(`auth responded ${res.status}`);
      await auth.getSession();
    }),
  ]);

  const ok = database.ok && storage.ok && authService.ok;
  return Response.json(
    { ok, database, storage, auth: authService },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
