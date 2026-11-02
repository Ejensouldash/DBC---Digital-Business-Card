import {
  GlobeIcon,
  MailIcon,
  MapIcon,
  MessageCircleIcon,
  NavigationIcon,
  PhoneIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";

import { LINK_ICONS } from "@/features/links/lib/link-icons";
import type { LinkType } from "@/lib/link-types";
import { cn } from "@/lib/utils";

import {
  buildContactActions,
  type ContactActionKind,
  type ContactFields,
} from "../lib/contact-actions";

export type ProfileViewData = ContactFields & {
  displayName: string;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  links: { id: string; type: LinkType; label: string | null; url: string }[];
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

// Pure presentation, shared by the public page and the editor's live preview.
export function ProfileView({ profile, preview = false, children }: ProfileViewProps) {
  const t = useTranslations("Profile");
  const actions = buildContactActions(profile);
  const subtitle = [profile.jobTitle, profile.company].filter(Boolean).join(" · ");
  const inert = preview ? "pointer-events-none" : undefined;

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="relative h-32 w-full bg-muted">
        {profile.coverUrl ? (
          <Image
            src={profile.coverUrl}
            alt=""
            fill
            priority={!preview}
            unoptimized={preview}
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col items-center gap-4 px-5 pb-6">
        <div className="relative -mt-12 size-24 overflow-hidden rounded-full bg-muted ring-4 ring-card">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName}
              fill
              priority={!preview}
              unoptimized={preview}
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span
              className="flex size-full items-center justify-center text-3xl font-semibold text-muted-foreground"
              aria-hidden
            >
              {profile.displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <header className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{profile.displayName}</h1>
          {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
        </header>
        {profile.bio ? (
          <p className="text-center text-sm whitespace-pre-line">{profile.bio}</p>
        ) : null}

        {actions.length > 0 ? (
          <ul className="grid w-full grid-cols-3 gap-2">
            {actions.map(({ kind, href }) => {
              const Icon = ACTION_ICONS[kind];
              return (
                <li key={kind}>
                  <a
                    href={href}
                    {...(preview ? INERT : EXTERNAL_ACTIONS.has(kind) ? NEW_TAB : {})}
                    className={cn(
                      "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-secondary text-xs font-medium text-secondary-foreground outline-none hover:bg-secondary/80 focus-visible:ring-3 focus-visible:ring-ring/50",
                      inert,
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    {t(`actions.${kind}`)}
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}

        {children}

        {profile.links.length > 0 ? (
          <ul className="flex w-full flex-col gap-2">
            {profile.links.map((link) => {
              const Icon = LINK_ICONS[link.type];
              return (
                <li key={link.id}>
                  <a
                    href={link.url}
                    {...(preview ? INERT : NEW_TAB)}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl border px-4 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50",
                      inert,
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {link.label || t(`linkTypes.${link.type}`)}
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
