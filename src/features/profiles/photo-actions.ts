"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { profilePhotos, profiles } from "@/lib/db/schema";
import { deleteObject, isStorageConfigured, putPublicObject } from "@/lib/storage";

import { IMAGE_CONTENT_TYPES, readImage } from "./lib/image-validation";
import { imageUrl, photoKey, profileTag } from "./lib/images";
import { MAX_PROFILE_PHOTOS } from "./schemas";

export type PhotoError =
  "unauthorized" | "invalid" | "not_found" | "limit" | "unavailable" | "unexpected";

async function ownedProfile(userId: string, profileId: string) {
  return db.query.profiles.findFirst({
    where: and(eq(profiles.id, profileId), eq(profiles.ownerId, userId)),
    columns: { id: true, slug: true },
  });
}

// Adds one gallery photo (resized to ≤1600px in the browser) to the end of the gallery.
export async function addProfilePhoto(
  formData: FormData,
): Promise<ActionResult<{ id: string; url: string }, PhotoError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  if (!isStorageConfigured()) return fail("unavailable");
  const profileId = z.uuid().safeParse(formData.get("profileId"));
  if (!profileId.success) return fail("invalid");
  const profile = await ownedProfile(user.id, profileId.data);
  if (!profile) return fail("not_found");
  const image = await readImage(formData.get("image"), ["webp", "jpg"]);
  if (!image) return fail("invalid");

  const key = photoKey(user.id, profile.id, image.format);
  try {
    await putPublicObject(key, image.bytes, IMAGE_CONTENT_TYPES[image.format]);
  } catch (error) {
    console.error("[photos] upload failed", error);
    return fail("unexpected");
  }

  // Lock the profile row so two uploads at once can't both squeeze in as photo number 8.
  const inserted = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select 1 from ${profiles} where ${profiles.id} = ${profile.id} for update`,
    );
    const [{ total } = { total: 0 }] = await tx
      .select({ total: count() })
      .from(profilePhotos)
      .where(eq(profilePhotos.profileId, profile.id));
    if (total >= MAX_PROFILE_PHOTOS) return null;
    const [row] = await tx
      .insert(profilePhotos)
      .values({ profileId: profile.id, path: key, position: total })
      .returning({ id: profilePhotos.id });
    return row ?? null;
  });
  if (!inserted) {
    await deleteObject(key).catch(() => undefined);
    return fail("limit");
  }

  updateTag(profileTag(profile.slug));
  return ok({ id: inserted.id, url: imageUrl(key) ?? "" });
}

export async function deleteProfilePhoto(
  photoId: string,
): Promise<ActionResult<undefined, PhotoError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  if (!z.uuid().safeParse(photoId).success) return fail("invalid");

  const [photo] = await db
    .select({ id: profilePhotos.id, path: profilePhotos.path, slug: profiles.slug })
    .from(profilePhotos)
    .innerJoin(profiles, eq(profiles.id, profilePhotos.profileId))
    .where(and(eq(profilePhotos.id, photoId), eq(profiles.ownerId, user.id)));
  if (!photo) return fail("not_found");

  await db.delete(profilePhotos).where(eq(profilePhotos.id, photo.id));
  await deleteObject(photo.path).catch((error: unknown) =>
    console.error("[photos] delete object failed", error),
  );
  updateTag(profileTag(photo.slug));
  return ok();
}
