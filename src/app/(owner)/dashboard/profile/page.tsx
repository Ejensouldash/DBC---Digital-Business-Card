import { getTranslations } from "next-intl/server";

import { listProfileLinks } from "@/features/links/queries";
import { ProfileEditor } from "@/features/profiles/components/profile-editor";
import { ProfileSwitcher } from "@/features/profiles/components/profile-switcher";
import { EMPTY_PROFILE, toFormInput } from "@/features/profiles/lib/form-defaults";
import { imageUrl } from "@/features/profiles/lib/images";
import { getOwnerProfile, listOwnerProfiles, listProfilePhotos } from "@/features/profiles/queries";
import { EDITOR_TABS, type EditorTab } from "@/features/profiles/schemas";
import { requireUser } from "@/lib/auth/session";
import { env } from "@/lib/env";

function parseTab(value: string | string[] | undefined): EditorTab {
  return EDITOR_TABS.find((tab) => tab === value) ?? "details";
}

export default async function ProfilePage({ searchParams }: PageProps<"/dashboard/profile">) {
  const [user, query, t] = await Promise.all([
    requireUser("/dashboard/profile"),
    searchParams,
    getTranslations("ProfileEditor"),
  ]);
  const ownerProfiles = await listOwnerProfiles(user.id);
  const requestedId = typeof query.profile === "string" ? query.profile : ownerProfiles[0]?.id;
  const isNew = query.new === "1" || !requestedId;
  const profile = !isNew && requestedId ? await getOwnerProfile(user.id, requestedId) : null;
  const [links, photos] = profile
    ? await Promise.all([listProfileLinks(profile.id), listProfilePhotos(profile.id)])
    : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile ? t("title") : t("newTitle")}
        </h1>
        {ownerProfiles.length > 0 ? (
          <ProfileSwitcher
            profiles={ownerProfiles}
            currentId={profile?.id ?? null}
            basePath="/dashboard/profile"
            allowNew
          />
        ) : null}
      </div>
      <ProfileEditor
        key={profile?.id ?? "new"}
        profileId={profile?.id ?? null}
        defaults={
          profile
            ? toFormInput(profile)
            : { ...EMPTY_PROFILE, displayName: user.name, email: user.email }
        }
        images={{
          avatar: imageUrl(profile?.avatarPath ?? null),
          cover: imageUrl(profile?.coverPath ?? null),
          logo: imageUrl(profile?.companyLogoPath ?? null),
        }}
        photos={photos.flatMap((photo) => {
          const url = imageUrl(photo.path);
          return url ? [{ id: photo.id, url }] : [];
        })}
        links={links}
        profileBaseUrl={`${env.NEXT_PUBLIC_SITE_URL}/p/`}
        tab={parseTab(query.tab)}
      />
    </div>
  );
}
