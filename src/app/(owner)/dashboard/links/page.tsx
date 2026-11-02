import { ExternalLinkIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { LinksManager } from "@/features/links/components/links-manager";
import { listProfileLinks } from "@/features/links/queries";
import { ProfileSwitcher } from "@/features/profiles/components/profile-switcher";
import { selectProfile } from "@/features/profiles/lib/select-profile";
import { listOwnerProfiles } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/session";

export default async function LinksPage({ searchParams }: PageProps<"/dashboard/links">) {
  const [user, query, t] = await Promise.all([
    requireUser("/dashboard/links"),
    searchParams,
    getTranslations("Links"),
  ]);
  const ownerProfiles = await listOwnerProfiles(user.id);
  const profile = selectProfile(ownerProfiles, query.profile);

  if (!profile) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title={t("title")} description={t("noProfile")} />
        <div>
          <Button asChild>
            <Link href="/dashboard/profile?new=1">{t("createProfile")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const links = await listProfileLinks(profile.id);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <ProfileSwitcher
              profiles={ownerProfiles}
              currentId={profile.id}
              basePath="/dashboard/links"
            />
            {profile.isPublished ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/p/${profile.slug}`} target="_blank">
                  <ExternalLinkIcon aria-hidden />
                  {t("viewPublic")}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />
      <LinksManager key={profile.id} profileId={profile.id} initialLinks={links} />
    </div>
  );
}
