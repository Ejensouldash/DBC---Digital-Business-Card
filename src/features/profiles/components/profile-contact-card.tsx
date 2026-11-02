import {
  GlobeIcon,
  MailIcon,
  MapIcon,
  MapPinIcon,
  NavigationIcon,
  PhoneIcon,
  Share2Icon,
  UserPlusIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { buildContactActions, type ContactActionKind } from "../lib/contact-actions";
import { linkProps } from "../lib/view-links";

import { ProfileCard, ROW, RowIcon } from "./profile-cards";
import { QrButton, ShareButton } from "./profile-share-actions";
import type { ProfileViewData } from "./profile-view";

type ContactCardProps = {
  profile: ProfileViewData;
  vcardUrl: string;
  profileUrl: string;
  preview: boolean;
  step: number;
  // Optional extra action, e.g. the exchange-contacts form.
  children?: ReactNode;
};

const SECONDARY =
  "flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white text-sm font-medium text-zinc-900 outline-none transition hover:bg-zinc-50 active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-ring/60";

export function ProfileContactCard({
  profile,
  vcardUrl,
  profileUrl,
  preview,
  step,
  children,
}: ContactCardProps) {
  const t = useTranslations("Profile");
  const actions: Partial<Record<ContactActionKind, string>> = Object.fromEntries(
    buildContactActions(profile).map((action) => [action.kind, action.href]),
  );
  const rows: { href: string; Icon: LucideIcon; text: string; external: boolean }[] = [];
  if (actions.call && profile.phone) {
    rows.push({ href: actions.call, Icon: PhoneIcon, text: profile.phone, external: false });
  }
  if (actions.email && profile.email) {
    rows.push({ href: actions.email, Icon: MailIcon, text: profile.email, external: false });
  }
  if (actions.website && profile.website) {
    const text = profile.website.replace(/^https?:\/\/(www\.)?/, "");
    rows.push({ href: actions.website, Icon: GlobeIcon, text, external: true });
  }

  return (
    <ProfileCard title={t("sections.contact")} step={step}>
      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-zinc-100">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              fill
              unoptimized={preview}
              sizes="56px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-zinc-900">{profile.displayName}</p>
          {profile.jobTitle ? <p className="truncate text-zinc-600">{profile.jobTitle}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <a key={row.href} href={row.href} {...linkProps(preview, row.external)} className={ROW}>
            <RowIcon>
              <row.Icon className="size-4" aria-hidden />
            </RowIcon>
            <span className="min-w-0 grow truncate">{row.text}</span>
          </a>
        ))}
        {profile.address ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-900">
            <p className="flex gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span className="whitespace-pre-line">{profile.address}</span>
            </p>
            <div className="flex gap-2">
              {actions.waze ? (
                <a href={actions.waze} {...linkProps(preview, true)} className={SECONDARY}>
                  <NavigationIcon className="size-4" aria-hidden />
                  {t("actions.waze")}
                </a>
              ) : null}
              {actions.maps ? (
                <a href={actions.maps} {...linkProps(preview, true)} className={SECONDARY}>
                  <MapIcon className="size-4" aria-hidden />
                  {t("actions.maps")}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <a
        href={vcardUrl}
        {...linkProps(preview)}
        className="sheen flex h-14 items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground glow transition outline-none focus-visible:ring-3 focus-visible:ring-ring/60 active:scale-[0.98]"
      >
        <UserPlusIcon className="size-5" aria-hidden />
        {t("saveContact")}
      </a>
      <div className={cn("flex gap-2", preview && "pointer-events-none")}>
        <ShareButton
          displayName={profile.displayName}
          profileUrl={profileUrl}
          className={SECONDARY}
        >
          <Share2Icon className="size-4" aria-hidden />
          {t("share")}
        </ShareButton>
        <QrButton displayName={profile.displayName} profileUrl={profileUrl} className={SECONDARY} />
      </div>
      {children}
    </ProfileCard>
  );
}
