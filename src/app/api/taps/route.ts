import { after } from "next/server";

import { recordTap } from "@/features/analytics/lib/record-tap";
import { tapBeaconSchema } from "@/features/analytics/schemas";
import { getPublicProfile } from "@/features/profiles/queries";

// Receives the profile page's visit beacon. Always 204 so it reveals nothing about profiles.
export async function POST(request: Request) {
  const parsed = tapBeaconSchema.safeParse(await request.json().catch(() => null));
  if (parsed.success) {
    const profile = await getPublicProfile(parsed.data.slug);
    if (profile) {
      const headers = new Headers(request.headers);
      const { source } = parsed.data;
      after(() => recordTap({ profileId: profile.id, source, headers }));
    }
  }
  return new Response(null, { status: 204 });
}
