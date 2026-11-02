import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { cardUrl, generateCardCode } from "@/lib/card-code";
import { toCsv } from "@/lib/csv";
import type * as schema from "@/lib/db/schema";
import { cardBatches, cards } from "@/lib/db/schema";

// Shared by the admin UI (request-scoped db) and scripts/generate-cards.ts (its own pool),
// so it takes the database as a parameter and imports nothing server-only.
type Database = NodePgDatabase<typeof schema>;

type NewBatch = { name: string; quantity: number; notes: string | null; createdBy: string | null };

const MAX_ROUNDS = 10;

export async function createBatch(db: Database, batch: NewBatch) {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(cardBatches)
      .values(batch)
      .returning({ id: cardBatches.id, name: cardBatches.name });
    if (!created) throw new Error("batch insert returned nothing");

    // Codes are random; on the rare collision the row is skipped and another code is drawn.
    const codes: string[] = [];
    for (let round = 0; codes.length < batch.quantity; round++) {
      if (round >= MAX_ROUNDS) throw new Error("could not generate unique card codes");
      const candidates = Array.from({ length: batch.quantity - codes.length }, () => ({
        code: generateCardCode(),
        batchId: created.id,
      }));
      const inserted = await tx
        .insert(cards)
        .values(candidates)
        .onConflictDoNothing({ target: cards.code })
        .returning({ code: cards.code });
      codes.push(...inserted.map((row) => row.code));
    }
    return { ...created, codes };
  });
}

// One row per card: the chip URL (NFC writer) and the QR URL (printed on the card).
export function batchCsv(siteUrl: string, codes: string[]): string {
  return toCsv(
    ["code", "url", "qr_url"],
    codes.map((code) => {
      const url = cardUrl(siteUrl, code);
      return [code, url, `${url}?src=qr`];
    }),
  );
}

export function batchFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "batch"}.csv`;
}
