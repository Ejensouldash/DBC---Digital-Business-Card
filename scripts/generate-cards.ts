// Creates a card batch and writes out/<batch>.csv (code,url,qr_url) for NFC writing and printing.
//   pnpm cards:generate --batch "Batch Nov 2026" --qty 100 [--notes "Printer: ABC"]
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { batchCsv, batchFilename, createBatch } from "../src/features/admin/lib/create-batch";
import { createBatchSchema } from "../src/features/admin/schemas";

import { connect, runScript, siteUrl } from "./db";

void runScript(async () => {
  const { values } = parseArgs({
    options: {
      batch: { type: "string" },
      qty: { type: "string" },
      notes: { type: "string", default: "" },
    },
  });
  const parsed = createBatchSchema.safeParse({
    name: values.batch ?? "",
    quantity: values.qty ?? "",
    notes: values.notes,
  });
  if (!parsed.success) {
    throw new Error('Usage: pnpm cards:generate --batch "Batch name" --qty 100 [--notes "..."]');
  }

  const { db, close } = connect();
  try {
    const batch = await createBatch(db, { ...parsed.data, createdBy: null });
    const file = path.join("out", batchFilename(batch.name));
    await mkdir("out", { recursive: true });
    await writeFile(file, batchCsv(siteUrl(), batch.codes), "utf8");
    console.log(`Created batch "${batch.name}" with ${batch.codes.length} cards → ${file}`);
  } finally {
    await close();
  }
});
