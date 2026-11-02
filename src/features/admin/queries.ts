import "server-only";

import { and, asc, count, countDistinct, desc, eq, ilike, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { escapeLike } from "@/lib/db/like";
import { neonAuthUser } from "@/lib/db/neon-auth";
import { cardBatches, cards, profiles } from "@/lib/db/schema";

import { CARDS_PAGE_SIZE, type CardFilter } from "./schemas";

const countWhere = (condition: SQL) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

export async function listBatches() {
  return db
    .select({
      id: cardBatches.id,
      name: cardBatches.name,
      quantity: cardBatches.quantity,
      notes: cardBatches.notes,
      createdAt: cardBatches.createdAt,
      unclaimed: countWhere(sql`${cards.status} = 'unclaimed'`),
      active: countWhere(sql`${cards.status} = 'active'`),
      disabled: countWhere(sql`${cards.status} = 'disabled'`),
    })
    .from(cardBatches)
    .leftJoin(cards, eq(cards.batchId, cardBatches.id))
    .groupBy(cardBatches.id)
    .orderBy(desc(cardBatches.createdAt));
}

export async function getBatchForExport(batchId: string) {
  const batch = await db.query.cardBatches.findFirst({ where: eq(cardBatches.id, batchId) });
  if (!batch) return null;
  const rows = await db
    .select({ code: cards.code })
    .from(cards)
    .where(eq(cards.batchId, batchId))
    .orderBy(asc(cards.createdAt), asc(cards.code));
  return { name: batch.name, codes: rows.map((row) => row.code) };
}

export async function searchCards({ status, batch, q, page }: CardFilter) {
  const where = and(
    status ? eq(cards.status, status) : undefined,
    batch ? eq(cards.batchId, batch) : undefined,
    q ? ilike(cards.code, `${escapeLike(q)}%`) : undefined,
  );

  const [rows, [total]] = await Promise.all([
    db
      .select({
        id: cards.id,
        code: cards.code,
        status: cards.status,
        label: cards.label,
        claimedAt: cards.claimedAt,
        batchName: cardBatches.name,
        ownerEmail: neonAuthUser.email,
        profileSlug: profiles.slug,
      })
      .from(cards)
      .leftJoin(cardBatches, eq(cardBatches.id, cards.batchId))
      .leftJoin(neonAuthUser, eq(neonAuthUser.id, cards.ownerId))
      .leftJoin(profiles, eq(profiles.id, cards.profileId))
      .where(where)
      .orderBy(desc(cards.createdAt), asc(cards.code))
      .limit(CARDS_PAGE_SIZE)
      .offset((page - 1) * CARDS_PAGE_SIZE),
    db.select({ value: count() }).from(cards).where(where),
  ]);

  return { rows, total: total?.value ?? 0 };
}

export type AdminCardRow = Awaited<ReturnType<typeof searchCards>>["rows"][number];

export async function listUsers(search: string | undefined) {
  const term = search?.trim();
  return db
    .select({
      id: neonAuthUser.id,
      name: neonAuthUser.name,
      email: neonAuthUser.email,
      role: neonAuthUser.role,
      createdAt: neonAuthUser.createdAt,
      // Distinct, because joining both tables multiplies rows (profiles × cards).
      profiles: countDistinct(profiles.id),
      cards: countDistinct(cards.id),
    })
    .from(neonAuthUser)
    .leftJoin(profiles, eq(profiles.ownerId, neonAuthUser.id))
    .leftJoin(cards, eq(cards.ownerId, neonAuthUser.id))
    .where(term ? ilike(neonAuthUser.email, `%${escapeLike(term)}%`) : undefined)
    .groupBy(
      neonAuthUser.id,
      neonAuthUser.name,
      neonAuthUser.email,
      neonAuthUser.role,
      neonAuthUser.createdAt,
    )
    .orderBy(desc(neonAuthUser.createdAt))
    .limit(200);
}

export type AdminUserRow = Awaited<ReturnType<typeof listUsers>>[number];

export async function countAdmins(): Promise<number> {
  return db.$count(neonAuthUser, eq(neonAuthUser.role, "admin"));
}
