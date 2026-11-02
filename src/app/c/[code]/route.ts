import { after, NextResponse, type NextRequest } from "next/server";

import { recordTap } from "@/features/analytics/lib/record-tap";
import { resolveCard } from "@/features/cards/queries";
import { cardCodeSchema } from "@/lib/card-code";

// NFC entry point written on every chip: https://<site>/c/<CODE>. No locale prefix, so the
// chip URL never changes. Visitors land on BM pages; the language switcher is on each page.
function redirectTo(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url), 307);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest, { params }: RouteContext<"/c/[code]">) {
  const { code: rawCode } = await params;
  const parsed = cardCodeSchema.safeParse(rawCode);
  if (!parsed.success) return redirectTo(request, "/card/invalid");

  const code = parsed.data;
  const card = await resolveCard(code);
  if (!card) return redirectTo(request, "/card/inactive");
  if (card.status === "unclaimed") return redirectTo(request, `/activate/${code}`);
  if (!card.slug || !card.profileId) return redirectTo(request, "/card/inactive");

  // Printed QR codes point at /c/<CODE>?src=qr; everything else is an NFC tap.
  const source = request.nextUrl.searchParams.get("src") === "qr" ? "qr" : "nfc";
  const { profileId, id: cardId } = card;
  const headers = new Headers(request.headers);
  after(() => recordTap({ profileId, cardId, source, headers }));

  // `via=card` tells the profile page this visit is already logged.
  return redirectTo(request, `/p/${card.slug}?src=${source}&via=card`);
}
