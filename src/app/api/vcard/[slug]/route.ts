import { vcardPhotoKey, imageUrl } from "@/features/profiles/lib/images";
import { getPublicProfile } from "@/features/profiles/queries";
import { env } from "@/lib/env";
import { buildVCard } from "@/lib/vcard";

async function fetchPhotoBase64(avatarPath: string | null): Promise<string | undefined> {
  const url = avatarPath ? imageUrl(vcardPhotoKey(avatarPath)) : null;
  if (!url) return undefined;
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    return Buffer.from(await response.arrayBuffer()).toString("base64");
  } catch {
    // A missing photo should never block saving the contact.
    return undefined;
  }
}

export async function GET(_request: Request, { params }: RouteContext<"/api/vcard/[slug]">) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return new Response("Not found", { status: 404 });

  const vcard = buildVCard(
    { ...profile, profileUrl: `${env.NEXT_PUBLIC_SITE_URL}/p/${profile.slug}` },
    profile.links,
    await fetchPhotoBase64(profile.avatarPath),
  );

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${profile.slug}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
