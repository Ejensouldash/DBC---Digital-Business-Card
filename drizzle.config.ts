import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read Next's env files; locally load the one `neon env pull` writes.
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// Migrations run over the direct (unpooled) connection, as Neon recommends.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is not set. Run `neon env pull`.");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
