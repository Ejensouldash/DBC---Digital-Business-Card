import "server-only";

import { and, eq } from "drizzle-orm";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { db as Database } from "@/lib/db";
import { cards, profiles } from "@/lib/db/schema";

export type ClaimError = "not_found" | "disabled" | "already_claimed" | "profile_not_found";

type Executor = Pick<typeof Database, "select" | "update">;

// Atomic: the conditional UPDATE only succeeds while the card is still unclaimed,
// so two people tapping "claim" at once cannot both win.
export async function claimCardFor(
  tx: Executor,
  { code, profileId, userId }: { code: string; profileId: string; userId: string },
): Promise<ActionResult<undefined, ClaimError>> {
  const [profile] = await tx
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.ownerId, userId)))
    .limit(1);
  if (!profile) return fail("profile_not_found");

  const claimed = await tx
    .update(cards)
    .set({ ownerId: userId, profileId, status: "active", claimedAt: new Date() })
    .where(and(eq(cards.code, code), eq(cards.status, "unclaimed")))
    .returning({ id: cards.id });
  if (claimed.length > 0) return ok();

  const [card] = await tx
    .select({ status: cards.status })
    .from(cards)
    .where(eq(cards.code, code))
    .limit(1);
  if (!card) return fail("not_found");
  return fail(card.status === "disabled" ? "disabled" : "already_claimed");
}
