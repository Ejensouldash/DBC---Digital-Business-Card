import {
  ArrowUpRightIcon,
  GlobeIcon,
  MailIcon,
  MapIcon,
  MessageCircleIcon,
  NavigationIcon,
  PhoneIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";

import { LINK_ICONS } from "@/features/links/lib/link-icons";
import type { LinkType } from "@/lib/link-types";
import { THEME_ACCENTS, type ProfileTheme } from "@/lib/profile-theme";
import { cn } from "@/lib/utils";

import {
  buildContactActions,
  type ContactActionKind,
  type ContactFields,
} from "../lib/contact-actions";

import { ProfileHeader } from "./profile-header";

export type ProfileViewData = ContactFields & {
  displayName: string;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  links: { id: string; type: LinkType; label: string | null; url: string }[];
  theme: ProfileTheme;
};

const ACTION_ICONS: Record<ContactActionKind, LucideIcon> = {
  call: PhoneIcon,
  whatsapp: MessageCircleIcon,
  email: MailIcon,
  website: GlobeIcon,
  waze: NavigationIcon,
  maps: MapIcon,
};

const EXTERNAL_ACTIONS: ReadonlySet<ContactActionKind> = new Set(["website", "waze", "maps"]);

const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" } as const;
const INERT = { tabIndex: -1, "aria-disabled": true } as const;

type ProfileViewProps = {
  profile: ProfileViewData;
  // In the editor preview links are inert and images skip the optimizer (they may be blob: URLs).
  preview?: boolean;
  children?: ReactNode;
};

// Accent colours for one profile, scoped to its card: buttons use --primary as they are.
export function accentVars(theme: ProfileTheme): CSSProperties {
  const accent = THEME_ACCENTS[theme.accent];
  return {
    "--primary": accent.solid,
    "--primary-foreground": accent.on,
    "--ring": accent.soft,
    "--accent-soft": accent.soft,
  } as CSSProperties;
}

const TILE =
  "glass lift flex outline-none hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-ring/60";

// Pure presentation, shared by the public page and the editor's live preview.
// Entrance motion is CSS only (animate-rise + --i), so the public page ships no animation JS.
export function ProfileView({ profile, preview = false, children }: ProfileViewProps) {
  const t = useTranslations("Profile");
  const actions = buildContactActions(profile);
  const subtitle = [profile.jobTitle, profile.company].filter(Boolean).join(" · ");
  const inert = preview ? "pointer-events-none" : undefined;
  let step = 1;
  const rise = () => ({ "--i": step++ }) as CSSProperties;

  return (
    <article
      style={accentVars(profile.theme)}
      className="flex w-full flex-col overflow-hidden rounded-3xl glass pb-6"
    >
      <ProfileHeader
        displayName={profile.displayName}
        subtitle={subtitle}
        avatarUrl={profile.avatarUrl}
        coverUrl={profile.coverUrl}
        compact={profile.theme.layout === "compact"}
        preview={preview}
      />
      <div className="mt-4 flex flex-col items-center gap-5 px-5">
        {profile.bio ? (
          <p
            style={rise()}
            className="animate-rise text-center text-sm whitespace-pre-line text-muted-foreground"
          >
            {profile.bio}
          </p>
        ) : null}

        {actions.length > 0 ? (
          <ul style={rise()} className="grid w-full animate-rise grid-cols-3 gap-2">
            {actions.map(({ kind, href }) => {
              const Icon = ACTION_ICONS[kind];
              return (
                <li key={kind}>
                  <a
                    href={href}
                    {...(preview ? INERT : EXTERNAL_ACTIONS.has(kind) ? NEW_TAB : {})}
                    className={cn(
                      TILE,
                      "min-h-18 flex-col items-center justify-center gap-1.5 rounded-2xl text-xs font-medium",
                      inert,
                    )}
                  >
                    <Icon className="size-5 text-accent-soft" aria-hidden />
                    {t(`actions.${kind}`)}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}

        {children ? (
          <div style={rise()} className="flex w-full animate-rise flex-col gap-2">
            {children}
          </div>
        ) : null}

        {profile.links.length > 0 ? (
          <ul style={rise()} className="flex w-full animate-rise flex-col gap-2">
            {profile.links.map((link) => {
              const Icon = LINK_ICONS[link.type];
              return (
                <li key={link.id}>
                  <a
                    href={link.url}
                    {...(preview ? INERT : NEW_TAB)}
                    className={cn(
                      TILE,
                      "group min-h-14 items-center gap-3 rounded-2xl px-4 text-sm font-medium",
                      inert,
                    )}
                  >
                    <span className="flex size-8 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="size-4 text-accent-soft" aria-hidden />
                    </span>
                    <span className="grow">{link.label || t(`linkTypes.${link.type}`)}</span>
                    <ArrowUpRightIcon
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden
                    />
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
