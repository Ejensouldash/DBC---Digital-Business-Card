"use client";

import { MessageCircleIcon, Share2Icon, UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { linkProps } from "../lib/view-links";

import { ShareButton } from "./profile-share-actions";

type ProfileStickyBarProps = {
  displayName: string;
  vcardUrl: string;
  whatsappUrl: string | null;
  profileUrl: string;
  preview: boolean;
};

const ICON_BUTTON =
  "flex size-10 items-center justify-center rounded-full outline-none transition active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/60";

// Slides in once the hero has scrolled away, so the key actions stay one tap away.
// The sentinel sits just above the hero's buttons; works in the page and in the editor's
// scrolling phone preview alike.
export function ProfileStickyBar({
  displayName,
  vcardUrl,
  whatsappUrl,
  profileUrl,
  preview,
}: ProfileStickyBarProps) {
  const t = useTranslations("Profile");
  const sentinel = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = sentinel.current;
    if (!element) return;
    // In the editor the profile scrolls inside the phone frame, not the window.
    const root = element.closest<HTMLElement>("[data-scroll-root]");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const top = entry.rootBounds?.top ?? 0;
        setVisible(!entry.isIntersecting && entry.boundingClientRect.top < top);
      },
      { root },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden className="pointer-events-none absolute top-80 h-px w-px" />
      <div className="sticky top-0 z-30 h-0">
        <div
          inert={!visible}
          className={cn(
            "absolute inset-x-0 top-0 flex items-center gap-2 border-b border-black/5 bg-white/85 px-3 py-2 backdrop-blur-xl transition duration-300",
            visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
          )}
        >
          <p className="min-w-0 grow truncate font-semibold">{displayName}</p>
          <a
            href={vcardUrl}
            {...linkProps(preview)}
            aria-label={t("saveContact")}
            className={cn(ICON_BUTTON, "bg-primary text-primary-foreground")}
          >
            <UserPlusIcon className="size-5" aria-hidden />
          </a>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              {...linkProps(preview, true)}
              aria-label={t("actions.whatsapp")}
              className={cn(ICON_BUTTON, "bg-zinc-100 text-zinc-900")}
            >
              <MessageCircleIcon className="size-5" aria-hidden />
            </a>
          ) : null}
          <ShareButton
            displayName={displayName}
            profileUrl={profileUrl}
            className={cn(
              ICON_BUTTON,
              "bg-zinc-100 text-zinc-900",
              preview && "pointer-events-none",
            )}
          >
            <Share2Icon className="size-5" aria-hidden />
            <span className="sr-only">{t("share")}</span>
          </ShareButton>
        </div>
      </div>
    </>
  );
}
