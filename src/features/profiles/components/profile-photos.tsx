"use client";

import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState, type KeyboardEvent } from "react";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Photo = { id: string; url: string };
type ProfilePhotosProps = { photos: Photo[]; ownerName: string; preview: boolean };

// Bento layout by count: 1 wide, 2 side by side, 3 = one wide + two squares, 4+ = 2x2.
function tileClass(index: number, total: number): string {
  if (total === 1) return "col-span-2 aspect-video";
  if (total === 3 && index === 0) return "col-span-2 aspect-video";
  return "aspect-square";
}

const NAV_BUTTON =
  "absolute top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur outline-none hover:bg-white/25 focus-visible:ring-3 focus-visible:ring-white/70 disabled:opacity-30";

export function ProfilePhotos({ photos, ownerName, preview }: ProfilePhotosProps) {
  const t = useTranslations("Profile.gallery");
  const [open, setOpen] = useState<number | null>(null);
  const shown = photos.slice(0, 4);
  const hidden = photos.length - shown.length;
  const current = open === null ? null : photos[open];

  const go = (step: number) =>
    setOpen((index) =>
      index === null ? null : Math.min(photos.length - 1, Math.max(0, index + step)),
    );

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2">
        {shown.map((photo, index) => {
          const more = index === shown.length - 1 && hidden > 0 ? hidden : 0;
          return (
            <li key={photo.id} className={tileClass(index, shown.length)}>
              <button
                type="button"
                tabIndex={preview ? -1 : undefined}
                onClick={() => setOpen(index)}
                className="group relative block size-full overflow-hidden rounded-2xl bg-zinc-100 outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
              >
                <Image
                  src={photo.url}
                  alt={t("photoAlt", { n: index + 1, total: photos.length, name: ownerName })}
                  fill
                  unoptimized={preview}
                  sizes="(max-width: 480px) 50vw, 240px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
                {more ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-2xl font-semibold text-white">
                    {t("more", { count: more })}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog open={open !== null} onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
        <DialogContent
          onKeyDown={onKeyDown}
          aria-describedby={undefined}
          showCloseButton={false}
          className="max-w-[calc(100%-1rem)] gap-0 border-0 bg-black/95 p-0 text-white ring-0 sm:max-w-3xl"
        >
          <DialogTitle className="sr-only">{t("title", { name: ownerName })}</DialogTitle>
          {current && open !== null ? (
            <div className="relative aspect-[4/5] w-full sm:aspect-[4/3]">
              <Image
                src={current.url}
                alt={t("photoAlt", { n: open + 1, total: photos.length, name: ownerName })}
                fill
                unoptimized={preview}
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={open === 0}
                aria-label={t("previous")}
                className={cn(NAV_BUTTON, "left-3")}
              >
                <ChevronLeftIcon className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={open === photos.length - 1}
                aria-label={t("next")}
                className={cn(NAV_BUTTON, "right-3")}
              >
                <ChevronRightIcon className="size-6" aria-hidden />
              </button>
              <DialogClose
                aria-label={t("close")}
                className={cn(NAV_BUTTON, "top-3 right-3 translate-y-0")}
              >
                <XIcon className="size-5" aria-hidden />
              </DialogClose>
              <p
                aria-live="polite"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur"
              >
                {t("counter", { n: open + 1, total: photos.length })}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
