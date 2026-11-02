import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TapBeacon } from "@/features/analytics/components/tap-beacon";
import { LeadFormDialog } from "@/features/leads/components/lead-form-dialog";
import { ProfileView } from "@/features/profiles/components/profile-view";
import { imageUrl } from "@/features/profiles/lib/images";
import { getPublicProfile } from "@/features/profiles/queries";
import { env } from "@/lib/env";
import { parseTheme } from "@/lib/profile-theme";

// The whole page depends on the slug and query, so it renders at request time.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
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

export default async function PublicProfilePage({ params, searchParams }: PageProps<"/p/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const profile = await getPublicProfile(slug);
  if (!profile) notFound();

  // Card taps (/c/CODE) are logged before the redirect and arrive with via=card.
  const isCardTap = query.via === "card";
  const source = query.src === "qr" ? "qr" : "link";
  const t = await getTranslations("Profile");

  return (
    <main className="light flex grow justify-center bg-zinc-200">
      {isCardTap ? null : <TapBeacon slug={profile.slug} source={source} />}
      <div className="flex w-full max-w-[480px] flex-col bg-[#eef0f4] sm:my-6 sm:overflow-hidden sm:rounded-3xl sm:shadow-xl">
        <ProfileView
          profile={{
            ...profile,
            avatarUrl: imageUrl(profile.avatarPath),
            coverUrl: imageUrl(profile.coverPath),
            companyLogoUrl: imageUrl(profile.companyLogoPath),
            photos: profile.photos.flatMap((photo) => {
              const url = imageUrl(photo.path);
              return url ? [{ id: photo.id, url }] : [];
            }),
            theme: parseTheme(profile.theme),
          }}
          vcardUrl={`/api/vcard/${profile.slug}`}
          profileUrl={`${env.NEXT_PUBLIC_SITE_URL}/p/${profile.slug}`}
        >
          {profile.leadFormEnabled ? (
            <LeadFormDialog slug={profile.slug} ownerName={profile.displayName} />
          ) : null}
        </ProfileView>
        <footer className="flex justify-center gap-3 pb-8 text-xs text-zinc-500">
          <span>{t("poweredBy")}</span>
          <Link href="/privacy" className="hover:underline">
            {t("privacy")}
          </Link>
        </footer>
      </div>
    </main>
  );
}
