"use server";

import { eq, sql } from "drizzle-orm";

import { cardCodeSchema } from "@/lib/card-code";
import { db } from "@/lib/db";
import { neonAuthUser } from "@/lib/db/neon-auth";
import { cards } from "@/lib/db/schema";

export type CheckSignInResult = { allowed: true } | { allowed: false; message: string };

export type VerifyCodeResult = { ok: true; redirectUrl: string } | { ok: false; error: string };

/**
 * Checks whether an email is permitted to receive an OTP code.
 *
 * Monetization & Access Restriction Policy:
 * 1. Existing users (admins, previously activated card owners) are allowed to sign in.
 * 2. New signups are only allowed if they are activating a valid, unclaimed physical card
 *    (indicated by `next` containing `/activate/<UNCLAIMED_CODE>`).
 * 3. Strangers without a card cannot create free accounts.
 */
export async function checkCanSignInWithEmail(
  email: string,
  nextPath?: string,
): Promise<CheckSignInResult> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check if user already exists
  const [existingUser] = await db
    .select({ id: neonAuthUser.id })
    .from(neonAuthUser)
    .where(eq(sql`lower(${neonAuthUser.email})`, normalizedEmail))
    .limit(1);

  if (existingUser) {
    return { allowed: true };
  }

  // 2. If user does not exist, check if they are visiting from an unclaimed card activation link
  if (nextPath) {
    const match = nextPath.match(/\/activate\/([23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8})/i);
    if (match) {
      const code = match[1].toUpperCase();
      const [card] = await db
        .select({ id: cards.id, status: cards.status })
        .from(cards)
        .where(eq(cards.code, code))
        .limit(1);

      if (card && card.status === "unclaimed") {
        return { allowed: true };
      }
    }
  }

  return {
    allowed: false,
    message:
      "No account found with this email. To register, you must have an active physical card. Please enter your card code below or tap your physical NFC card.",
  };
}

/**
 * Validates a physical card activation code entered by a customer.
 */
export async function verifyCardCodeForActivation(rawCode: string): Promise<VerifyCodeResult> {
  const trimmed = rawCode.trim().toUpperCase();
  const parsed = cardCodeSchema.safeParse(trimmed);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Invalid card code format. Must be an 8-character code (e.g. 23456789).",
    };
  }

  const code = parsed.data;
  const [card] = await db
    .select({ id: cards.id, status: cards.status })
    .from(cards)
    .where(eq(cards.code, code))
    .limit(1);

  if (!card) {
    return {
      ok: false,
      error:
        "Card code not found. Please check the code printed on your physical card or packaging.",
    };
  }

  if (card.status === "active") {
    return {
      ok: false,
      error: "This card has already been activated. Please sign in with your account email above.",
    };
  }

  if (card.status === "disabled") {
    return {
      ok: false,
      error: "This card has been disabled. Please contact support.",
    };
  }

  return {
    ok: true,
    redirectUrl: `/activate/${code}`,
  };
}
