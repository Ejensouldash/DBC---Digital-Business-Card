import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { listProfileLinks } from "@/features/links/queries";
import { db } from "@/lib/db";
import { profilePhotos, profiles, type Profile } from "@/lib/db/schema";

import { profileTag } from "./lib/images";

export type PublicProfile = Profile & {
  links: Awaited<ReturnType<typeof listProfileLinks>>;
  photos: ProfilePhotoRow[];
};

export async function listProfilePhotos(profileId: string) {
  return db
    .select({ id: profilePhotos.id, path: profilePhotos.path })
    .from(profilePhotos)
    .where(eq(profilePhotos.profileId, profileId))
    .orderBy(asc(profilePhotos.position), asc(profilePhotos.createdAt));
}

export type ProfilePhotoRow = Awaited<ReturnType<typeof listProfilePhotos>>[number];

// Public pages are hit on every tap, so they are cached and invalidated by tag on edit.
export async function getPublicProfile(slug: string): Promise<PublicProfile | null> {
  "use cache";
  cacheTag(profileTag(slug));
  cacheLife("hours");

  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.slug, slug), eq(profiles.isPublished, true)),
  });
  if (!profile) return null;
  const [links, photos] = await Promise.all([
    listProfileLinks(profile.id, { visibleOnly: true }),
    listProfilePhotos(profile.id),
  ]);
  return { ...profile, links, photos };
}

export async function listOwnerProfiles(ownerId: string) {
  return db
    .select({
      id: profiles.id,
      slug: profiles.slug,
      displayName: profiles.displayName,
      isPublished: profiles.isPublished,
    })
    .from(profiles)
    .where(eq(profiles.ownerId, ownerId))
    .orderBy(asc(profiles.createdAt));
}

export type OwnerProfileSummary = Awaited<ReturnType<typeof listOwnerProfiles>>[number];

export async function getOwnerProfile(ownerId: string, profileId: string): Promise<Profile | null> {
  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, profileId), eq(profiles.ownerId, ownerId)),
  });
  return profile ?? null;
}
