"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isUniqueViolation } from "@/lib/db/errors";
import { profiles } from "@/lib/db/schema";
import { deleteObject, isStorageConfigured, putPublicObject } from "@/lib/storage";

import { IMAGE_CONTENT_TYPES, readImage } from "./lib/image-validation";
import { imageKey, imageUrl, profileTag, vcardPhotoKey } from "./lib/images";
import { IMAGE_KINDS, profileFormSchema, type ImageKind, type ProfileFormInput } from "./schemas";

export type ProfileError =
  "unauthorized" | "invalid" | "not_found" | "slug_taken" | "unavailable" | "unexpected";

function saveError(error: unknown): ActionResult<never, ProfileError> {
  if (isUniqueViolation(error, "profiles_slug_key")) return fail("slug_taken");
  console.error("[profiles] save failed", error);
  return fail("unexpected");
}

const profileIdSchema = z.uuid();

export async function createProfile(
  input: ProfileFormInput,
): Promise<ActionResult<{ id: string }, ProfileError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");

  try {
    const [created] = await db
      .insert(profiles)
      .values({ ...parsed.data, ownerId: user.id })
      .returning({ id: profiles.id });
    if (!created) return fail("invalid");
    return ok({ id: created.id });
  } catch (error) {
    return saveError(error);
  }
}

export async function updateProfile(
  profileId: string,
  input: ProfileFormInput,
): Promise<ActionResult<undefined, ProfileError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  const parsed = profileFormSchema.safeParse(input);
  if (!profileIdSchema.safeParse(profileId).success || !parsed.success) return fail("invalid");

  const ownedBy = and(eq(profiles.id, profileId), eq(profiles.ownerId, user.id));
  const existing = await db.query.profiles.findFirst({ where: ownedBy, columns: { slug: true } });
  if (!existing) return fail("not_found");

  try {
    await db.update(profiles).set(parsed.data).where(ownedBy);
  } catch (error) {
    return saveError(error);
  }
  updateTag(profileTag(existing.slug));
  if (parsed.data.slug !== existing.slug) updateTag(profileTag(parsed.data.slug));
  return ok();
}

const uploadSchema = z.object({ profileId: z.uuid(), kind: z.enum(IMAGE_KINDS) });

const IMAGE_COLUMNS = {
  avatar: "avatarPath",
  cover: "coverPath",
  logo: "companyLogoPath",
} as const satisfies Record<ImageKind, keyof typeof profiles.$inferSelect>;

// The browser resizes before upload: avatar → 512px square + 256px JPEG twin (vCard),
// cover → 1200px wide, logo → 256px. WebP where the browser can encode it, JPEG otherwise.
export async function uploadProfileImage(
  formData: FormData,
): Promise<ActionResult<{ url: string }, ProfileError>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthorized");
  if (!isStorageConfigured()) return fail("unavailable");
  const parsed = uploadSchema.safeParse({
    profileId: formData.get("profileId"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) return fail("invalid");
  const { profileId, kind } = parsed.data;

  const ownedBy = and(eq(profiles.id, profileId), eq(profiles.ownerId, user.id));
  const existing = await db.query.profiles.findFirst({
    where: ownedBy,
    columns: { slug: true, avatarPath: true, coverPath: true, companyLogoPath: true },
  });
  if (!existing) return fail("not_found");

  const image = await readImage(formData.get("image"), ["webp", "jpg"]);
  const vcardPhoto =
    kind === "avatar" ? await readImage(formData.get("vcardPhoto"), ["jpg"]) : null;
  if (!image || (kind === "avatar" && !vcardPhoto)) return fail("invalid");

  const key = imageKey(user.id, profileId, kind, image.format);
  try {
    await putPublicObject(key, image.bytes, IMAGE_CONTENT_TYPES[image.format]);
    if (vcardPhoto) await putPublicObject(vcardPhotoKey(key), vcardPhoto.bytes, "image/jpeg");
    await db
      .update(profiles)
      .set({ [IMAGE_COLUMNS[kind]]: key })
      .where(ownedBy);
  } catch (error) {
    console.error("[profiles] image upload failed", error);
    return fail("unexpected");
  }
  updateTag(profileTag(existing.slug));

  const previous = existing[IMAGE_COLUMNS[kind]];
  if (previous) {
    const stale = kind === "avatar" ? [previous, vcardPhotoKey(previous)] : [previous];
    await Promise.allSettled(stale.map(deleteObject));
  }
  return ok({ url: imageUrl(key) ?? "" });
}
