import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profileLinks } from "@/lib/db/schema";

export async function listProfileLinks(profileId: string, { visibleOnly = false } = {}) {
  return db
    .select({
      id: profileLinks.id,
      type: profileLinks.type,
      label: profileLinks.label,
      url: profileLinks.url,
    })
    .from(profileLinks)
    .where(
      visibleOnly
        ? and(eq(profileLinks.profileId, profileId), eq(profileLinks.isVisible, true))
        : eq(profileLinks.profileId, profileId),
    )
    .orderBy(asc(profileLinks.position));
}
