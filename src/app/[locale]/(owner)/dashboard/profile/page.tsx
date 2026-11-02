import { getTranslations } from "next-intl/server";

import { ProfileEditor } from "@/features/profiles/components/profile-editor";
import { ProfileSwitcher } from "@/features/profiles/components/profile-switcher";
import { imageUrl } from "@/features/profiles/lib/images";
import { getOwnerProfile, listOwnerProfiles } from "@/features/profiles/queries";
import type { ProfileFormInput } from "@/features/profiles/schemas";
import { listProfileLinks } from "@/features/links/queries";
import { requireUser } from "@/lib/auth/session";
import type { Profile } from "@/lib/db/schema";
import { env } from "@/lib/env";

const EMPTY_PROFILE: ProfileFormInput = {
  slug: "",
  displayName: "",
  jobTitle: "",
  company: "",
  bio: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  address: "",
  mapsUrl: "",
  isPublished: true,
  allowIndexing: false,
};

function toFormInput(profile: Profile): ProfileFormInput {
  return {
    slug: profile.slug,
    displayName: profile.displayName,
    jobTitle: profile.jobTitle ?? "",
    company: profile.company ?? "",
    bio: profile.bio ?? "",
    phone: profile.phone ?? "",
    whatsapp: profile.whatsapp ?? "",
    email: profile.email ?? "",
    website: profile.website ?? "",
    address: profile.address ?? "",
    mapsUrl: profile.mapsUrl ?? "",
    isPublished: profile.isPublished,
    allowIndexing: profile.allowIndexing,
  };
}

export default async function ProfilePage({
  searchParams,
}: PageProps<"/[locale]/dashboard/profile">) {
  const [user, query, t] = await Promise.all([
    requireUser("/dashboard/profile"),
    searchParams,
    getTranslations("ProfileEditor"),
  ]);
  const ownerProfiles = await listOwnerProfiles(user.id);
  const requestedId = typeof query.profile === "string" ? query.profile : ownerProfiles[0]?.id;
  const isNew = query.new === "1" || !requestedId;
  const profile = !isNew && requestedId ? await getOwnerProfile(user.id, requestedId) : null;
  const links = profile ? await listProfileLinks(profile.id, { visibleOnly: true }) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile ? t("title") : t("newTitle")}
        </h1>
        {ownerProfiles.length > 0 ? (
          <ProfileSwitcher profiles={ownerProfiles} currentId={profile?.id ?? null} />
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
        avatarUrl={imageUrl(profile?.avatarPath ?? null)}
        coverUrl={imageUrl(profile?.coverPath ?? null)}
        links={links}
        profileBaseUrl={`${env.NEXT_PUBLIC_SITE_URL}/p/`}
      />
    </div>
  );
}
