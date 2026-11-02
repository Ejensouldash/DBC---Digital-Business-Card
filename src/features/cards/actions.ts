"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { onboardingSchema, type OnboardingInput } from "@/features/profiles/schemas";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/session";
import { cardCodeSchema } from "@/lib/card-code";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { cards, profiles } from "@/lib/db/schema";

import { claimCardFor, type ClaimError } from "./lib/claim";
import { cardLabelSchema } from "./schemas";

type ActivateError = ClaimError | "unauthorized" | "invalid" | "slug_taken" | "unexpected";

class ClaimRejected extends Error {
  constructor(readonly reason: ClaimError) {
    super(reason);
  }
}

export async function claimCard(
  rawCode: string,
  profileId: string,
): Promise<ActionResult<undefined, ActivateError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  const code = cardCodeSchema.safeParse(rawCode);
  if (!code.success || !z.uuid().safeParse(profileId).success) return fail("invalid");

  try {
    return await claimCardFor(db, { code: code.data, profileId, userId: user.id });
  } catch (error) {
    console.error("[cards] claim failed", error);
    return fail("unexpected");
  }
}

// First-time activation: create the owner's first profile and claim the card together,
// so a failed claim never leaves an orphan profile behind.
export async function createProfileAndClaimCard(
  rawCode: string,
  input: OnboardingInput,
): Promise<ActionResult<undefined, ActivateError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  const code = cardCodeSchema.safeParse(rawCode);
  const parsed = onboardingSchema.safeParse(input);
  if (!code.success || !parsed.success) return fail("invalid");

  try {
    await db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(profiles)
        .values({
          ...parsed.data,
          ownerId: user.id,
          whatsapp: parsed.data.phone,
          email: user.email,
          isPublished: true,
        })
        .returning({ id: profiles.id });
      if (!profile) throw new ClaimRejected("profile_not_found");

      const claimed = await claimCardFor(tx, {
        code: code.data,
        profileId: profile.id,
        userId: user.id,
      });
      if (!claimed.ok) throw new ClaimRejected(claimed.error);
    });
    return ok();
  } catch (error) {
    if (error instanceof ClaimRejected) return fail(error.reason);
    if (isUniqueViolation(error, "profiles_slug_key")) return fail("slug_taken");
    console.error("[cards] activation failed", error);
    return fail("unexpected");
  }
}

export type OwnerCardError = "unauthorized" | "invalid" | "not_found" | "unexpected";
type OwnerCardResult = ActionResult<undefined, OwnerCardError>;

// Updates one of the signed-in owner's cards. The owner filter in the WHERE clause is the
// authorization check: someone else's card id simply matches no row.
async function updateOwnCard(
  cardId: string,
  changes: Partial<Pick<typeof cards.$inferInsert, "label" | "profileId" | "status">>,
): Promise<OwnerCardResult> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  if (!z.uuid().safeParse(cardId).success) return fail("invalid");

  try {
    if (changes.profileId) {
      const [profile] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(and(eq(profiles.id, changes.profileId), eq(profiles.ownerId, user.id)))
        .limit(1);
      if (!profile) return fail("not_found");
    }
    const updated = await db
      .update(cards)
      .set(changes)
      .where(and(eq(cards.id, cardId), eq(cards.ownerId, user.id)))
      .returning({ id: cards.id });
    return updated.length > 0 ? ok() : fail("not_found");
  } catch (error) {
    console.error("[cards] update failed", error);
    return fail("unexpected");
  }
}

export async function renameCard(cardId: string, label: string): Promise<OwnerCardResult> {
  const parsed = cardLabelSchema.safeParse(label);
  if (!parsed.success) return fail("invalid");
  return updateOwnCard(cardId, { label: parsed.data });
}

export async function pointCardAtProfile(
  cardId: string,
  profileId: string,
): Promise<OwnerCardResult> {
  if (!z.uuid().safeParse(profileId).success) return fail("invalid");
  return updateOwnCard(cardId, { profileId });
}

// Owners can switch a lost card off and back on, but never release it to "unclaimed".
export async function setCardEnabled(cardId: string, enabled: boolean): Promise<OwnerCardResult> {
  if (typeof enabled !== "boolean") return fail("invalid");
  return updateOwnCard(cardId, { status: enabled ? "active" : "disabled" });
}
