import "server-only";

import { publicObjectUrl } from "@/lib/storage";

import type { ImageKind } from "../schemas";

import type { ImageFormat } from "./image-validation";

// Object keys: {userId}/{profileId}/{kind}-{timestamp}.{ext}. Every upload gets a new key,
// so cached copies never go stale. Avatars also get a small JPEG twin for vCards.
export function imageKey(userId: string, profileId: string, kind: ImageKind, ext: ImageFormat) {
  return `${userId}/${profileId}/${kind}-${Date.now()}.${ext}`;
}

export function photoKey(userId: string, profileId: string, ext: ImageFormat) {
  return `${userId}/${profileId}/photo-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

export function vcardPhotoKey(avatarKey: string): string {
  return avatarKey.replace(/\.(webp|jpg)$/, "-vcard.jpg");
}

export function imageUrl(key: string | null): string | null {
  return key ? publicObjectUrl(key) : null;
}

export function profileTag(slug: string): string {
  return `profile:${slug}`;
}
