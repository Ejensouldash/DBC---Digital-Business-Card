import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { TapBeacon } from "@/features/analytics/components/tap-beacon";
import { ProfileShareActions } from "@/features/profiles/components/profile-share-actions";
import { ProfileView } from "@/features/profiles/components/profile-view";
import { imageUrl } from "@/features/profiles/lib/images";
import { getPublicProfile } from "@/features/profiles/queries";
import { env } from "@/lib/env";

// The whole page depends on the slug and query, so it renders at request time.
export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return { robots: { index: false } };

  const description = [profile.jobTitle, profile.company].filter(Boolean).join(" · ") || undefined;
  const avatar = imageUrl(profile.avatarPath);
  return {
    title: profile.displayName,
    description,
    alternates: { canonical: `/p/${profile.slug}` },
    robots: { index: profile.allowIndexing, follow: profile.allowIndexing },
    openGraph: {
      type: "profile",
      title: profile.displayName,
      description,
      url: `/p/${profile.slug}`,
      images: avatar ? [{ url: avatar, width: 512, height: 512 }] : undefined,
    },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PageProps<"/[locale]/p/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const profile = await getPublicProfile(slug);
  if (!profile) notFound();

  // Card taps (/c/CODE) are logged before the redirect and arrive with via=card.
  const isCardTap = query.via === "card";
  const source = query.src === "qr" ? "qr" : "link";
  const t = await getTranslations("Profile");
  const profileUrl = `${env.NEXT_PUBLIC_SITE_URL}/p/${profile.slug}`;

  return (
    <main className="flex grow flex-col items-center bg-muted/40 px-4 py-6">
      {isCardTap ? null : <TapBeacon slug={profile.slug} source={source} />}
      <div className="flex w-full max-w-[480px] flex-col gap-4">
        <ProfileView
          profile={{
            ...profile,
            avatarUrl: imageUrl(profile.avatarPath),
            coverUrl: imageUrl(profile.coverPath),
          }}
        >
          <ProfileShareActions
            displayName={profile.displayName}
            vcardUrl={`/api/vcard/${profile.slug}`}
            profileUrl={profileUrl}
          />
        </ProfileView>
        <footer className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("poweredBy")}</span>
          <LocaleSwitcher />
        </footer>
      </div>
    </main>
  );
}
