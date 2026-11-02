import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Managed by Neon Auth (Better Auth). Read-only from our side: change users through the auth
// API, never with SQL. Lives outside schema.ts so drizzle-kit never creates or alters it.
export const neonAuthUser = pgSchema("neon_auth").table("user", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
});
