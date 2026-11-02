// Dev seed: one batch of 5 unclaimed cards. Idempotent; re-running prints the same cards.
// Run with `pnpm db:seed` (uses DATABASE_URL_UNPOOLED from .env.local).
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { cardUrl, generateCardCode } from "../src/lib/card-code";
import * as schema from "../src/lib/db/schema";

const BATCH_NAME = "Dev seed batch";
const QUANTITY = 5;

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is not set. Run `neon env pull`.");

  const pool = new Pool({ connectionString });
  const db = drizzle({ client: pool, schema });

  try {
    let batch = await db.query.cardBatches.findFirst({
      where: eq(schema.cardBatches.name, BATCH_NAME),
    });
    if (!batch) {
      [batch] = await db
        .insert(schema.cardBatches)
        .values({ name: BATCH_NAME, quantity: QUANTITY, notes: "Created by scripts/seed.ts" })
        .returning();
      await db.insert(schema.cards).values(
        Array.from({ length: QUANTITY }, () => ({
          code: generateCardCode(),
          batchId: batch!.id,
        })),
      );
    }

    const cards = await db
      .select({ code: schema.cards.code, status: schema.cards.status })
      .from(schema.cards)
      .where(eq(schema.cards.batchId, batch!.id));
    console.log(`Batch "${BATCH_NAME}":`);
    for (const card of cards)
      console.log(`  ${card.status.padEnd(9)} ${cardUrl(siteUrl, card.code)}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
