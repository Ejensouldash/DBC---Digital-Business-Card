"use server";

import { eq, inArray } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { countAdmins } from "@/features/admin/queries";
import { profileTag } from "@/features/profiles/lib/images";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { auth } from "@/lib/auth/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cards, profiles } from "@/lib/db/schema";
import { deleteAuthUser, isNeonApiConfigured } from "@/lib/neon-api";
import { deleteObjectsWithPrefix } from "@/lib/storage";

export type AccountError =
  "unauthorized" | "mismatch" | "last_admin" | "unavailable" | "unexpected";

// Deletes the account and everything in it (PDPA). The owner confirms by typing their email.
export async function deleteAccount(
  confirmEmail: string,
): Promise<ActionResult<undefined, AccountError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  const typed = z.string().trim().toLowerCase().safeParse(confirmEmail);
  if (!typed.success || typed.data !== user.email.toLowerCase()) return fail("mismatch");
  if (user.isAdmin && (await countAdmins()) <= 1) return fail("last_admin");
  if (!isNeonApiConfigured()) return fail("unavailable");

  const [ownCards, ownProfiles] = await Promise.all([
    db.select({ id: cards.id }).from(cards).where(eq(cards.ownerId, user.id)),
    db.select({ slug: profiles.slug }).from(profiles).where(eq(profiles.ownerId, user.id)),
  ]);

  // The auth user goes first: if Neon refuses, nothing has changed yet. Deleting it cascades
  // to profiles, links, taps and leads; cards keep existing with owner and profile cleared.
  if (!(await deleteAuthUser(user.id))) return fail("unexpected");

  try {
    // Lost or abandoned cards are switched off, never left claimable by whoever finds them.
    if (ownCards.length > 0) {
      await db
        .update(cards)
        .set({ status: "disabled", label: null })
        .where(
          inArray(
            cards.id,
            ownCards.map((card) => card.id),
          ),
        );
    }
    await deleteObjectsWithPrefix(`${user.id}/`);
  } catch (error) {
    // The account is already gone; log for an admin to finish the clean-up.
    console.error("[account] clean-up after deletion failed", { userId: user.id, error });
  }
  for (const { slug } of ownProfiles) updateTag(profileTag(slug));
  await auth.signOut().catch(() => undefined);
  return ok();
}
