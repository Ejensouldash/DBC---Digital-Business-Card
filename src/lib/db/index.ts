import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import * as schema from "./schema";

// Pooled Neon URL for app traffic. Vercel Fluid compute reuses the pool and
// closes idle clients before the function instance is suspended.
// Pin full certificate verification explicitly (pg v9 will weaken `sslmode=require`).
const connectionUrl = new URL(env.DATABASE_URL);
connectionUrl.searchParams.set("sslmode", "verify-full");

const pool = new Pool({ connectionString: connectionUrl.toString() });
attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema });
