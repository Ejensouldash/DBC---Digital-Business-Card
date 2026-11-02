import { ArrowUpRightIcon, BuildingIcon, GlobeIcon, PhoneIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

import { LINK_ICONS } from "@/features/links/lib/link-icons";
import { telHref } from "@/lib/phone";
import { cn } from "@/lib/utils";

import { linkProps } from "../lib/view-links";

import type { ProfileViewData } from "./profile-view";

// Light card shell shared by every section of the public profile.
export function ProfileCard({
  title,
  step,
  children,
}: {
  title: string;
  step: number;
  children: ReactNode;
}) {
  return (
    <section
      style={{ "--i": step } as CSSProperties}
      className="flex animate-rise flex-col gap-4 rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(0_0_0/0.18)]"
    >
      <h2 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">{title}</h2>
      {children}
    </section>
  );
}

// Big tap targets used in several cards.
export const ROW =
  "flex min-h-14 items-center gap-3 rounded-2xl bg-zinc-50 px-4 text-sm font-medium text-zinc-900 outline-none transition hover:bg-zinc-100 active:scale-[0.98] focus-visible:ring-3 focus-visible:ring-ring/60";

export function RowIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
      {children}
    </span>
  );
}

const hostname = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

type CardProps = { profile: ProfileViewData; preview: boolean; step: number };

export function hasOrganization(p: ProfileViewData): boolean {
  return Boolean(
    p.jobTitle || p.company || p.companyLogoUrl || p.industry || p.companyWebsite || p.officePhone,
  );
}

export function OrganizationCard({ profile, preview, step }: CardProps) {
  const t = useTranslations("Profile");
  const office = profile.officePhone ? telHref(profile.officePhone) : null;

  return (
    <ProfileCard title={t("sections.work")} step={step}>
      <div className="flex items-center gap-4">
        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {profile.companyLogoUrl ? (
            <Image
              src={profile.companyLogoUrl}
              alt={profile.company ?? ""}
              fill
              unoptimized={preview}
              sizes="56px"
              className="object-contain p-1.5"
            />
          ) : (
            <BuildingIcon className="size-6 text-zinc-400" aria-hidden />
          )}
        </div>
        <div className="min-w-0">
          {profile.jobTitle ? (
            <p className="text-lg leading-snug font-semibold text-zinc-900">{profile.jobTitle}</p>
          ) : null}
          {profile.company ? <p className="text-zinc-600">{profile.company}</p> : null}
          {profile.industry ? (
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              {profile.industry}
            </span>
          ) : null}
        </div>
      </div>
      {profile.companyWebsite || office ? (
        <div className="flex flex-col gap-2">
          {profile.companyWebsite ? (
            <a href={profile.companyWebsite} {...linkProps(preview, true)} className={ROW}>
              <RowIcon>
                <GlobeIcon className="size-4" aria-hidden />
              </RowIcon>
              <span className="min-w-0 grow truncate">{hostname(profile.companyWebsite)}</span>
              <span className="sr-only">({t("companyWebsite")})</span>
            </a>
          ) : null}
          {office ? (
            <a href={office} {...linkProps(preview)} className={ROW}>
              <RowIcon>
                <PhoneIcon className="size-4" aria-hidden />
              </RowIcon>
              <span className="grow">{profile.officePhone}</span>
              <span className="text-xs text-zinc-500">{t("office")}</span>
            </a>
          ) : null}
        </div>
      ) : null}
    </ProfileCard>
  );
}

export function AboutCard({ bio, step }: { bio: string; step: number }) {
  const t = useTranslations("Profile");
  return (
    <ProfileCard title={t("sections.about")} step={step}>
      <p className="leading-relaxed whitespace-pre-line text-zinc-700">{bio}</p>
    </ProfileCard>
  );
}

export function LinksCard({ profile, preview, step }: CardProps) {
  const t = useTranslations("Profile");
  return (
    <ProfileCard title={t("sections.links")} step={step}>
      <ul className="flex flex-col gap-2">
        {profile.links.map((link) => {
          const Icon = LINK_ICONS[link.type];
          return (
            <li key={link.id}>
              <a
                href={link.url}
                {...linkProps(preview, true)}
                className={cn(ROW, "group min-h-16 text-base")}
              >
                <RowIcon>
                  <Icon className="size-5" aria-hidden />
                </RowIcon>
                <span className="grow">{link.label || t(`linkTypes.${link.type}`)}</span>
                <ArrowUpRightIcon
                  className="size-5 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden
                />
              </a>
            </li>
          );
        })}
      </ul>
    </ProfileCard>
  );
}
