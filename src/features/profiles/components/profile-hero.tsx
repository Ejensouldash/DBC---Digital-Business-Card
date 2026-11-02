import { MapPinIcon, MessageCircleIcon, PhoneIcon, UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { linkProps } from "../lib/view-links";

type ProfileHeroProps = {
  displayName: string;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  vcardUrl: string;
  whatsappUrl: string | null;
  callUrl: string | null;
  preview: boolean;
};

const PILL =
  "flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold outline-none transition active:scale-[0.97] focus-visible:ring-3 focus-visible:ring-white/70";

// Full-bleed cover with a dark scrim, greeting, short bio, location and the two key actions.
export function ProfileHero({
  displayName,
  bio,
  location,
  avatarUrl,
  coverUrl,
  vcardUrl,
  whatsappUrl,
  callUrl,
  preview,
}: ProfileHeroProps) {
  const t = useTranslations("Profile");
  // WhatsApp is the second action when there is one; otherwise a plain call.
  const secondary = whatsappUrl
    ? { href: whatsappUrl, label: t("actions.whatsapp"), Icon: MessageCircleIcon, external: true }
    : callUrl
      ? { href: callUrl, label: t("actions.call"), Icon: PhoneIcon, external: false }
      : null;

  return (
    <header className="relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden text-white">
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt=""
          fill
          priority={!preview}
          unoptimized={preview}
          sizes="(max-width: 480px) 100vw, 480px"
          className="-z-10 object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(120%_80%_at_20%_0%,var(--primary),#0b0d14_70%)]"
        />
      )}
      {/* Scrim: keeps white text readable on any photo. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/55 to-black/10"
      />

      <div className="flex animate-rise flex-col gap-3 px-5 pt-24 pb-10">
        <div className="relative size-20 overflow-hidden rounded-full bg-white/15 ring-4 ring-white/80">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              priority={!preview}
              unoptimized={preview}
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex size-full items-center justify-center text-3xl font-semibold"
            >
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance">
          {t.rich("greeting", {
            name: displayName,
            b: (chunks) => <span className="block text-4xl">{chunks}</span>,
          })}
        </h1>
        {bio ? <p className="line-clamp-3 text-white/85">{bio}</p> : null}
        {location ? (
          <p className="flex items-center gap-1.5 text-sm text-white/85">
            <MapPinIcon className="size-4 shrink-0" aria-hidden />
            <span className="sr-only">{t("location")}: </span>
            {location}
          </p>
        ) : null}
        <div className="mt-3 flex gap-2">
          <a
            href={vcardUrl}
            {...linkProps(preview)}
            className={`${PILL} bg-primary text-primary-foreground shadow-lg ring-1 shadow-black/30 ring-white/30`}
          >
            <UserPlusIcon className="size-5" aria-hidden />
            {t("saveContact")}
          </a>
          {secondary ? (
            <a
              href={secondary.href}
              {...linkProps(preview, secondary.external)}
              className={`${PILL} bg-white text-zinc-900`}
            >
              <secondary.Icon className="size-5 text-green-700" aria-hidden />
              {secondary.label}
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
