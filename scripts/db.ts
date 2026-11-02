// Database access for CLI scripts. The app's `@/lib/db` is server-only (Next.js); scripts use
// their own short-lived pool over the direct connection.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "../src/lib/db/schema";

export function connect() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is not set. Run `neon env pull`.");
  const pool = new Pool({ connectionString });
  return { db: drizzle({ client: pool, schema }), close: () => pool.end() };
}

export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL is not set.");
  return url;
}

export async function runScript(main: () => Promise<void>) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
