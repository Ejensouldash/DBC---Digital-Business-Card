"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { MAX_PROFILE_PHOTOS } from "../schemas";

import { ImagePicker } from "./image-picker";
import type { MediaPhoto } from "./use-profile-media";

type PhotoManagerProps = {
  photos: MediaPhoto[];
  busy: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (photo: MediaPhoto) => void;
};

export function PhotoManager({ photos, busy, onAdd, onRemove }: PhotoManagerProps) {
  const t = useTranslations("ProfileEditor.photos");
  const full = photos.length >= MAX_PROFILE_PHOTOS;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("count", { count: photos.length, max: MAX_PROFILE_PHOTOS })}
        </p>
        {full ? null : (
          <ImagePicker
            label={t("add")}
            busy={busy}
            multiple
            crop
            cropTitle="Adjust Gallery Photo"
            cropAspect={1}
            cropAspectOptions={[
              { label: "1:1", value: 1 },
              { label: "4:3", value: 4 / 3 },
              { label: "16:9", value: 16 / 9 },
            ]}
            onFiles={onAdd}
          />
        )}
      </div>
      {photos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.id} className="relative aspect-square overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- may be a local blob: preview */}
              <img src={photo.url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(photo)}
                aria-label={t("remove", { n: index + 1 })}
                className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-black/70 text-white outline-none hover:bg-black focus-visible:ring-3 focus-visible:ring-ring/60"
              >
                <XIcon className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
