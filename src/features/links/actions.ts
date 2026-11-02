"use server";

import { and, eq, inArray, max } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { profileTag } from "@/features/profiles/lib/images";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { profileLinks, profiles } from "@/lib/db/schema";

import { linkFormSchema, reorderSchema, type LinkFormInput } from "./schemas";

export type LinkError = "unauthorized" | "invalid" | "not_found" | "unexpected";
type Result<T = undefined> = ActionResult<T, LinkError>;

const idSchema = z.uuid();

// Every query is scoped by owner, so a guessed id from another account matches nothing.
async function ownedProfileSlug(userId: string, profileId: string): Promise<string | null> {
  const [row] = await db
    .select({ slug: profiles.slug })
    .from(profiles)
    .where(and(eq(profiles.id, profileId), eq(profiles.ownerId, userId)))
    .limit(1);
  return row?.slug ?? null;
}

async function ownedLink(userId: string, linkId: string) {
  const [row] = await db
    .select({ profileId: profileLinks.profileId, slug: profiles.slug })
    .from(profileLinks)
    .innerJoin(profiles, eq(profiles.id, profileLinks.profileId))
    .where(and(eq(profileLinks.id, linkId), eq(profiles.ownerId, userId)))
    .limit(1);
  return row ?? null;
}

async function run<T>(task: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await task();
  } catch (error) {
    console.error("[links] action failed", error);
    return fail("unexpected");
  }
}

export async function addLink(
  profileId: string,
  input: LinkFormInput,
): Promise<Result<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  const parsed = linkFormSchema.safeParse(input);
  if (!idSchema.safeParse(profileId).success || !parsed.success) return fail("invalid");

  return run(async () => {
    const slug = await ownedProfileSlug(user.id, profileId);
    if (!slug) return fail("not_found");
    const [last] = await db
      .select({ position: max(profileLinks.position) })
      .from(profileLinks)
      .where(eq(profileLinks.profileId, profileId));
    const [created] = await db
      .insert(profileLinks)
      .values({ ...parsed.data, profileId, position: (last?.position ?? -1) + 1 })
      .returning({ id: profileLinks.id });
    updateTag(profileTag(slug));
    return created ? ok({ id: created.id }) : fail("unexpected");
  });
}

export async function updateLink(linkId: string, input: LinkFormInput): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  const parsed = linkFormSchema.safeParse(input);
  if (!idSchema.safeParse(linkId).success || !parsed.success) return fail("invalid");

  return run(async () => {
    const link = await ownedLink(user.id, linkId);
    if (!link) return fail("not_found");
    await db.update(profileLinks).set(parsed.data).where(eq(profileLinks.id, linkId));
    updateTag(profileTag(link.slug));
    return ok();
  });
}

export async function setLinkVisibility(linkId: string, isVisible: boolean): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  if (!idSchema.safeParse(linkId).success || typeof isVisible !== "boolean") return fail("invalid");

  return run(async () => {
    const link = await ownedLink(user.id, linkId);
    if (!link) return fail("not_found");
    await db.update(profileLinks).set({ isVisible }).where(eq(profileLinks.id, linkId));
    updateTag(profileTag(link.slug));
    return ok();
  });
}

export async function deleteLink(linkId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  if (!idSchema.safeParse(linkId).success) return fail("invalid");

  return run(async () => {
    const link = await ownedLink(user.id, linkId);
    if (!link) return fail("not_found");
    await db.delete(profileLinks).where(eq(profileLinks.id, linkId));
    updateTag(profileTag(link.slug));
    return ok();
  });
}

// `orderedIds` must be exactly the profile's links, in their new order.
export async function reorderLinks(profileId: string, orderedIds: string[]): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  const ids = reorderSchema.safeParse(orderedIds);
  if (!idSchema.safeParse(profileId).success || !ids.success) return fail("invalid");

  return run(async () => {
    const slug = await ownedProfileSlug(user.id, profileId);
    if (!slug) return fail("not_found");
    const existing = await db
      .select({ id: profileLinks.id })
      .from(profileLinks)
      .where(and(eq(profileLinks.profileId, profileId), inArray(profileLinks.id, ids.data)));
    if (existing.length !== ids.data.length || new Set(ids.data).size !== ids.data.length) {
      return fail("invalid");
    }

    await db.transaction(async (tx) => {
      for (const [position, id] of ids.data.entries()) {
        await tx.update(profileLinks).set({ position }).where(eq(profileLinks.id, id));
      }
    });
    updateTag(profileTag(slug));
    return ok();
  });
}
