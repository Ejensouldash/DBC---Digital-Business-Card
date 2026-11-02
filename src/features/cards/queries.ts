import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { cards, profiles, type CardStatus } from "@/lib/db/schema";

export type ResolvedCard = {
  id: string;
  status: CardStatus;
  ownerId: string | null;
  profileId: string | null;
  // Set only when the card is active and points at a published profile.
  slug: string | null;
};

export async function resolveCard(code: string): Promise<ResolvedCard | null> {
  const [row] = await db
    .select({
      id: cards.id,
      status: cards.status,
      ownerId: cards.ownerId,
      profileId: cards.profileId,
      slug: profiles.slug,
      isPublished: profiles.isPublished,
    })
    .from(cards)
    .leftJoin(profiles, eq(profiles.id, cards.profileId))
    .where(eq(cards.code, code))
    .limit(1);

  if (!row) return null;
  const isLive = row.status === "active" && row.isPublished === true;
  return {
    id: row.id,
    status: row.status,
    ownerId: row.ownerId,
    profileId: row.profileId,
    slug: isLive ? row.slug : null,
  };
}

export async function getOwnerCardCount(ownerId: string): Promise<number> {
  return db.$count(cards, and(eq(cards.ownerId, ownerId), eq(cards.status, "active")));
}
