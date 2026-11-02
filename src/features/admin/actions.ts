"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { authAdmin } from "@/lib/auth/server";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cards, profiles } from "@/lib/db/schema";
import { env } from "@/lib/env";

import { batchCsv, batchFilename, createBatch } from "./lib/create-batch";
import { countAdmins, getBatchForExport } from "./queries";
import { ADMIN_ROLES, createBatchSchema, reassignSchema, type CreateBatchInput } from "./schemas";

export type AdminError =
  "forbidden" | "invalid" | "not_found" | "profile_not_found" | "last_admin" | "unexpected";
type Result<T = undefined> = ActionResult<T, AdminError>;
type CsvFile = { filename: string; csv: string };

const idSchema = z.uuid();

// Every admin action re-checks the role; the layout guard is only the first layer.
async function asAdmin<T>(task: (admin: SessionUser) => Promise<Result<T>>): Promise<Result<T>> {
  const user = await getCurrentUser();
  if (!user?.isAdmin) return fail("forbidden");
  try {
    return await task(user);
  } catch (error) {
    console.error("[admin] action failed", error);
    return fail("unexpected");
  }
}

export async function createCardBatch(input: CreateBatchInput): Promise<Result<CsvFile>> {
  return asAdmin(async (admin) => {
    const parsed = createBatchSchema.safeParse(input);
    if (!parsed.success) return fail("invalid");
    const batch = await createBatch(db, { ...parsed.data, createdBy: admin.id });
    return ok({
      filename: batchFilename(batch.name),
      csv: batchCsv(env.NEXT_PUBLIC_SITE_URL, batch.codes),
    });
  });
}

export async function exportBatchCsv(batchId: string): Promise<Result<CsvFile>> {
  return asAdmin(async () => {
    if (!idSchema.safeParse(batchId).success) return fail("invalid");
    const batch = await getBatchForExport(batchId);
    if (!batch) return fail("not_found");
    return ok({
      filename: batchFilename(batch.name),
      csv: batchCsv(env.NEXT_PUBLIC_SITE_URL, batch.codes),
    });
  });
}

export async function setCardDisabled(cardId: string, disabled: boolean): Promise<Result> {
  return asAdmin(async () => {
    if (!idSchema.safeParse(cardId).success || typeof disabled !== "boolean")
      return fail("invalid");
    const card = await db.query.cards.findFirst({
      where: eq(cards.id, cardId),
      columns: { ownerId: true },
    });
    if (!card) return fail("not_found");
    // An unowned card that is re-enabled goes back to the claimable pool, clean.
    const changes = disabled
      ? { status: "disabled" as const }
      : card.ownerId
        ? { status: "active" as const }
        : { status: "unclaimed" as const, profileId: null, claimedAt: null, label: null };
    await db.update(cards).set(changes).where(eq(cards.id, cardId));
    return ok();
  });
}

// Wipes ownership so the card can be activated again (e.g. resold or replaced).
export async function resetCard(cardId: string): Promise<Result> {
  return asAdmin(async () => {
    if (!idSchema.safeParse(cardId).success) return fail("invalid");
    const updated = await db
      .update(cards)
      .set({ status: "unclaimed", ownerId: null, profileId: null, claimedAt: null, label: null })
      .where(eq(cards.id, cardId))
      .returning({ id: cards.id });
    return updated.length > 0 ? ok() : fail("not_found");
  });
}

// Moves a card to the profile with this slug (and to that profile's owner).
export async function reassignCard(cardId: string, slug: string): Promise<Result> {
  return asAdmin(async () => {
    const parsed = reassignSchema.safeParse({ cardId, slug });
    if (!parsed.success) return fail("invalid");
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.slug, parsed.data.slug),
      columns: { id: true, ownerId: true },
    });
    if (!profile) return fail("profile_not_found");
    const updated = await db
      .update(cards)
      .set({
        ownerId: profile.ownerId,
        profileId: profile.id,
        status: "active",
        claimedAt: new Date(),
      })
      .where(eq(cards.id, parsed.data.cardId))
      .returning({ id: cards.id });
    return updated.length > 0 ? ok() : fail("not_found");
  });
}

export async function setUserRole(userId: string, role: string): Promise<Result> {
  return asAdmin(async () => {
    const parsedRole = z.enum(ADMIN_ROLES).safeParse(role);
    if (!idSchema.safeParse(userId).success || !parsedRole.success) return fail("invalid");
    // Never leave the platform without an admin (this also covers the last admin demoting themself).
    if (parsedRole.data !== "admin" && (await countAdmins()) <= 1) return fail("last_admin");
    const { error } = await authAdmin.setRole({ userId, role: parsedRole.data });
    if (error) {
      console.error("[admin] setRole rejected", error);
      return fail("unexpected");
    }
    return ok();
  });
}
