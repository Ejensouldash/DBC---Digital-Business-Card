"use client";

import { useTranslations } from "next-intl";

import { IMAGE_KINDS, type ImageKind } from "../schemas";

import { ImagePicker } from "./image-picker";

type ImagesSectionProps = {
  images: Record<ImageKind, string | null>;
  busy: ImageKind | "photos" | null;
  pendingHint: boolean;
  onPick: (kind: ImageKind, file: File) => void;
};

const THUMB: Record<ImageKind, string> = {
  avatar: "size-14 rounded-full",
  cover: "h-14 w-24 rounded-lg",
  logo: "size-14 rounded-lg",
};

export function ImagesSection({ images, busy, pendingHint, onPick }: ImagesSectionProps) {
  const t = useTranslations("ProfileEditor");

  return (
    <section aria-labelledby="images-heading" className="flex flex-col gap-3">
      <h2 id="images-heading" className="font-medium">
        {t("sections.images")}
      </h2>
      <ul className="flex flex-col gap-3">
        {IMAGE_KINDS.map((kind) => (
          <li key={kind} className="flex items-center gap-3">
            <div
              className={`shrink-0 overflow-hidden ${THUMB[kind]} ${
                images[kind] && kind === "logo" ? "bg-white p-1" : "bg-muted"
              }`}
            >
              {images[kind] ? (
                // eslint-disable-next-line @next/next/no-img-element -- may be a local blob: preview
                <img
                  src={images[kind]}
                  alt=""
                  className={
                    kind === "logo" ? "size-full object-contain" : "size-full object-cover"
                  }
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm">{t(`images.${kind}.label`)}</span>
              <div>
                <ImagePicker
                  label={images[kind] ? t(`images.${kind}.change`) : t(`images.${kind}.upload`)}
                  busy={busy === kind}
                  onFiles={([file]) => file && onPick(kind, file)}
                  crop
                  cropTitle={`Adjust ${t(`images.${kind}.label`)}`}
                  cropAspect={kind === "cover" ? 3 : 1}
                  cropShape={kind === "avatar" ? "round" : "rect"}
                  cropAspectOptions={
                    kind === "cover"
                      ? [
                          { label: "3:1 (Banner)", value: 3 },
                          { label: "16:9", value: 16 / 9 },
                          { label: "4:3", value: 4 / 3 },
                          { label: "1:1", value: 1 },
                        ]
                      : undefined
                  }
                  currentImageUrl={images[kind]}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      {pendingHint ? <p className="text-xs text-muted-foreground">{t("images.pending")}</p> : null}
    </section>
  );
}
