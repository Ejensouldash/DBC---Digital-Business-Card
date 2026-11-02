// Dev seed: one batch of 5 unclaimed cards. Idempotent; re-running prints the same cards.
//   pnpm db:seed
import { eq } from "drizzle-orm";

import { createBatch } from "../src/features/admin/lib/create-batch";
import { cardUrl } from "../src/lib/card-code";
import { cardBatches, cards } from "../src/lib/db/schema";

import { connect, runScript, siteUrl } from "./db";

const BATCH_NAME = "Dev seed batch";

void runScript(async () => {
  const { db, close } = connect();
  try {
    let batch = await db.query.cardBatches.findFirst({ where: eq(cardBatches.name, BATCH_NAME) });
    if (!batch) {
      await createBatch(db, {
        name: BATCH_NAME,
        quantity: 5,
        notes: "Created by scripts/seed.ts",
        createdBy: null,
      });
      batch = await db.query.cardBatches.findFirst({ where: eq(cardBatches.name, BATCH_NAME) });
    }
    const rows = await db
      .select({ code: cards.code, status: cards.status })
      .from(cards)
      .where(eq(cards.batchId, batch!.id));
    console.log(`Batch "${BATCH_NAME}":`);
    for (const card of rows)
      console.log(`  ${card.status.padEnd(9)} ${cardUrl(siteUrl(), card.code)}`);
  } finally {
    await close();
  }
});
