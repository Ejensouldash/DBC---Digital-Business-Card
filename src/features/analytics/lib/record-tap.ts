import "server-only";

import { db } from "@/lib/db";
import { tapEvents, type TapSource } from "@/lib/db/schema";

import { detectDeviceType, isBot } from "./device";

type TapInput = {
  profileId: string;
  cardId?: string | null;
  source: TapSource;
  headers: Headers;
};

// Best effort: called from `after()`, so a failure never affects the visitor.
export async function recordTap({ profileId, cardId = null, source, headers }: TapInput) {
  const userAgent = headers.get("user-agent");
  if (isBot(userAgent)) return;

  const country = headers.get("x-vercel-ip-country");
  try {
    await db.insert(tapEvents).values({
      profileId,
      cardId,
      source,
      userAgent: userAgent?.slice(0, 512) ?? null,
      deviceType: detectDeviceType(userAgent),
      country: country && /^[A-Z]{2}$/.test(country) ? country : null,
      referrer: headers.get("referer")?.slice(0, 2048) ?? null,
    });
  } catch (error) {
    console.error("[analytics] failed to record tap", error);
  }
}
