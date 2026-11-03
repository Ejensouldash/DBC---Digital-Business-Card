import { ExternalLinkIcon, PencilIcon, PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { FlashToast } from "@/components/shared/flash-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OwnerStatsSection } from "@/features/analytics/components/owner-stats";
import { getOwnerStats } from "@/features/analytics/queries";
import { getOwnerCardCount } from "@/features/cards/queries";
import { ProfileSwitcher } from "@/features/profiles/components/profile-switcher";
import { QuickProfileForm } from "@/features/profiles/components/quick-profile-form";
import { ShareHub } from "@/features/profiles/components/share-hub";
import { imageUrl } from "@/features/profiles/lib/images";
import { selectProfile } from "@/features/profiles/lib/select-profile";
import { getOwnerProfile, listOwnerProfiles } from "@/features/profiles/queries";
import { CardScannerDialog } from "@/features/scanner/components/card-scanner-dialog";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const [user, query, t] = await Promise.all([
    requireUser("/dashboard"),
    searchParams,
    getTranslations("Dashboard"),
  ]);
  const [ownerProfiles, cardCount, stats] = await Promise.all([
    listOwnerProfiles(user.id),
    getOwnerCardCount(user.id),
    getOwnerStats(user.id),
  ]);
  const selected = selectProfile(ownerProfiles, query.profile);
  const hubProfile = selected ? await getOwnerProfile(user.id, selected.id) : null;

  return (
    <div className="flex flex-col gap-8">
      {query.claimed === "1" ? <FlashToast message={t("claimedToast")} /> : null}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("welcome", { name: user.name || user.email })}
          </h1>
          <p className="text-muted-foreground">{t("activeCards", { count: cardCount })}</p>
        </div>
        {ownerProfiles.length > 0 ? (
          <div>
            <CardScannerDialog
              profiles={ownerProfiles}
              defaultProfileId={hubProfile?.id}
            />
          </div>
        ) : null}
      </div>

      {hubProfile ? (
        <div className="flex flex-col gap-3">
          {ownerProfiles.length > 1 ? (
            <div className="flex justify-end">
              <ProfileSwitcher
                profiles={ownerProfiles}
                currentId={hubProfile.id}
                basePath="/dashboard"
              />
            </div>
          ) : null}
          <div className="mx-auto w-full max-w-md">
            <ShareHub
              displayName={hubProfile.displayName}
              jobTitle={hubProfile.jobTitle}
              company={hubProfile.company}
              avatarUrl={imageUrl(hubProfile.avatarPath)}
              slug={hubProfile.slug}
              profileUrl={`${env.NEXT_PUBLIC_SITE_URL}/p/${hubProfile.slug}`}
              isPublished={hubProfile.isPublished}
            />
          </div>
        </div>
      ) : (
        <section
          aria-labelledby="onboarding-title"
          className="relative overflow-hidden rounded-3xl glass p-5 sm:p-8"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgb(124_58_237/0.35),transparent_60%)]"
          />
          <h2 id="onboarding-title" className="text-xl font-semibold sm:text-2xl">
            {t("onboarding.title")}
          </h2>
          <p className="mt-1 mb-6 text-muted-foreground">{t("onboarding.description")}</p>
          <QuickProfileForm name={user.name} email={user.email} />
        </section>
      )}

      <OwnerStatsSection stats={stats} />

      <section aria-labelledby="profiles-heading" className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 id="profiles-heading" className="text-lg font-semibold">
            {t("profilesTitle")}
          </h2>
          <Button asChild size="sm" variant="outline">
            <Link href={{ pathname: "/dashboard/profile", query: { new: "1" } }}>
              <PlusIcon aria-hidden />
              {t("createProfile")}
            </Link>
          </Button>
        </div>
        {ownerProfiles.length === 0 ? null : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ownerProfiles.map((profile) => (
              <li key={profile.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{profile.displayName}</CardTitle>
                    <CardDescription>/p/{profile.slug}</CardDescription>
                    <CardAction>
                      <Badge variant={profile.isPublished ? "default" : "secondary"}>
                        {profile.isPublished ? t("published") : t("draft")}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button asChild size="sm">
                      <Link
                        href={{ pathname: "/dashboard/profile", query: { profile: profile.id } }}
                      >
                        <PencilIcon aria-hidden />
                        {t("edit")}
                      </Link>
                    </Button>
                    {profile.isPublished ? (
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/p/${profile.slug}`} target="_blank">
                          <ExternalLinkIcon aria-hidden />
                          {t("viewPublic")}
                        </Link>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
