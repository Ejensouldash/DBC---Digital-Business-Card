import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";

import type { LinkType } from "@/lib/link-types";
import { THEME_ACCENTS, type ProfileTheme } from "@/lib/profile-theme";

import { buildContactActions, type ContactFields } from "../lib/contact-actions";

import {
  AboutCard,
  hasOrganization,
  LinksCard,
  OrganizationCard,
  ProfileCard,
} from "./profile-cards";
import { ProfileContactCard } from "./profile-contact-card";
import { ProfileHero } from "./profile-hero";
import { ProfilePhotos } from "./profile-photos";
import { ProfileStickyBar } from "./profile-sticky-bar";

export type ProfileViewData = ContactFields & {
  displayName: string;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  location: string | null;
  industry: string | null;
  officePhone: string | null;
  companyWebsite: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  companyLogoUrl: string | null;
  links: { id: string; type: LinkType; label: string | null; url: string }[];
  photos: { id: string; url: string }[];
  theme: ProfileTheme;
};

type ProfileViewProps = {
  profile: ProfileViewData;
  vcardUrl: string;
  profileUrl: string;
  // In the editor preview links are inert and images skip the optimizer (they may be blob: URLs).
  preview?: boolean;
  // Extra action at the end of the contact card (the exchange-contacts form).
  children?: ReactNode;
};

// The owner's accent becomes --primary, so buttons and icons pick it up as they are.
function accentVars(theme: ProfileTheme): CSSProperties {
  const accent = THEME_ACCENTS[theme.accent];
  return {
    "--primary": accent,
    "--primary-foreground": "#ffffff",
    "--ring": accent,
  } as CSSProperties;
}

// The public profile: sticky action bar, full-bleed hero, then light modular cards.
// Shared by /p/[slug] and the editor's phone preview. Motion is CSS only (animate-rise).
export function ProfileView({
  profile,
  vcardUrl,
  profileUrl,
  preview = false,
  children,
}: ProfileViewProps) {
  const t = useTranslations("Profile");
  const actions = buildContactActions(profile);
  const whatsappUrl = actions.find((action) => action.kind === "whatsapp")?.href ?? null;
  const callUrl = actions.find((action) => action.kind === "call")?.href ?? null;
  let step = 1;

  return (
    <div
      style={accentVars(profile.theme)}
      className="light relative flex w-full flex-col bg-[#eef0f4] text-zinc-900"
    >
      <ProfileStickyBar
        displayName={profile.displayName}
        vcardUrl={vcardUrl}
        whatsappUrl={whatsappUrl}
        profileUrl={profileUrl}
        preview={preview}
      />
      <ProfileHero
        displayName={profile.displayName}
        bio={profile.bio}
        location={profile.location}
        avatarUrl={profile.avatarUrl}
        coverUrl={profile.coverUrl}
        vcardUrl={vcardUrl}
        whatsappUrl={whatsappUrl}
        callUrl={callUrl}
        preview={preview}
      />
      <div className="relative -mt-5 flex flex-col gap-3 rounded-t-3xl bg-[#eef0f4] px-3 pt-3 pb-6">
        {hasOrganization(profile) ? (
          <OrganizationCard profile={profile} preview={preview} step={step++} />
        ) : null}
        {profile.photos.length > 0 ? (
          <ProfileCard title={t("sections.photos")} step={step++}>
            <ProfilePhotos
              photos={profile.photos}
              ownerName={profile.displayName}
              preview={preview}
            />
          </ProfileCard>
        ) : null}
        {profile.bio ? <AboutCard bio={profile.bio} step={step++} /> : null}
        {profile.links.length > 0 ? (
          <LinksCard profile={profile} preview={preview} step={step++} />
        ) : null}
        <ProfileContactCard
          profile={profile}
          vcardUrl={vcardUrl}
          profileUrl={profileUrl}
          preview={preview}
          step={step++}
        >
          {children}
        </ProfileContactCard>
      </div>
    </div>
  );
}
