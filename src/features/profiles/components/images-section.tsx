"use client";

import {
  Building2Icon,
  CameraIcon,
  CropIcon,
  ImageIcon,
  Loader2Icon,
  UserRoundIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import type { ImageKind } from "../schemas";

import { ImagePicker } from "./image-picker";

type ImagesSectionProps = {
  images: Record<ImageKind, string | null>;
  busy: ImageKind | "photos" | null;
  pendingHint: boolean;
  onPick: (kind: ImageKind, file: File) => void;
};

export function ImagesSection({ images, busy, pendingHint, onPick }: ImagesSectionProps) {
  const t = useTranslations("ProfileEditor");

  return (
    <section aria-labelledby="images-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="images-heading" className="text-base font-semibold tracking-tight">
          {t("sections.images")}
        </h2>
        {pendingHint ? (
          <span className="text-xs text-muted-foreground">{t("images.pending")}</span>
        ) : null}
      </div>

      {/* Interactive Profile Card Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-xl backdrop-blur-md">
        {/* Cover Photo Area */}
        <div className="group/cover relative h-36 w-full overflow-hidden bg-muted/40 sm:h-44">
          {images.cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- user uploaded blob or cdn url
            <img src={images.cover} alt="Cover preview" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-background/50 text-muted-foreground/60">
              <div className="flex items-center gap-2 text-xs font-medium tracking-wide uppercase">
                <ImageIcon className="size-4" />
                <span>{t("images.cover.label")}</span>
              </div>
            </div>
          )}

          {/* Cover Action Controls */}
          <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 sm:top-3 sm:right-3">
            <ImagePicker
              label={images.cover ? t("images.cover.change") : t("images.cover.upload")}
              busy={busy === "cover"}
              onFiles={([file]) => file && onPick("cover", file)}
              crop
              cropTitle={`Adjust ${t("images.cover.label")}`}
              cropAspect={3}
              cropShape="rect"
              cropAspectOptions={[
                { label: "3:1 (Banner)", value: 3 },
                { label: "16:9", value: 16 / 9 },
                { label: "4:3", value: 4 / 3 },
                { label: "1:1", value: 1 },
              ]}
              currentImageUrl={images.cover}
            >
              {({ openPicker, openAdjust, canAdjust, busy: isBusy }) => (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy}
                    onClick={openPicker}
                    className="h-8 gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 text-xs font-medium text-white shadow-md backdrop-blur-md hover:bg-black/80"
                  >
                    {isBusy ? (
                      <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <CameraIcon className="size-3.5" aria-hidden />
                    )}
                    <span>{images.cover ? t("images.change") : t("images.upload")}</span>
                  </Button>
                  {canAdjust && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={openAdjust}
                      title="Adjust / Crop"
                      className="size-8 rounded-full border border-white/20 bg-black/60 p-0 text-white shadow-md backdrop-blur-md hover:bg-black/80"
                    >
                      <CropIcon className="size-3.5" aria-hidden />
                      <span className="sr-only">{t("images.adjust")}</span>
                    </Button>
                  )}
                </div>
              )}
            </ImagePicker>
          </div>
        </div>

        {/* Profile Avatar & Company Logo Row */}
        <div className="relative -mt-12 flex flex-wrap items-end justify-between gap-3 px-4 pb-4 sm:-mt-14">
          {/* Avatar Section */}
          <ImagePicker
            label={images.avatar ? t("images.avatar.change") : t("images.avatar.upload")}
            busy={busy === "avatar"}
            onFiles={([file]) => file && onPick("avatar", file)}
            crop
            cropTitle={`Adjust ${t("images.avatar.label")}`}
            cropAspect={1}
            cropShape="round"
            currentImageUrl={images.avatar}
          >
            {({ openPicker, openAdjust, canAdjust, busy: isBusy }) => (
              <div className="relative group shrink-0">
                <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-[#0b1021] bg-card shadow-2xl sm:size-28">
                  {images.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={images.avatar}
                      alt="Profile photo"
                      className="size-full object-cover"
                    />
                  ) : (
                    <UserRoundIcon className="size-10 text-muted-foreground" />
                  )}
                </div>

                {/* Avatar Action Badges */}
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={isBusy}
                  title={images.avatar ? t("images.avatar.change") : t("images.avatar.upload")}
                  className="absolute right-0 bottom-0 z-10 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-[#0b1021] transition-transform hover:scale-105 active:scale-95"
                >
                  {isBusy ? (
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <CameraIcon className="size-3.5" aria-hidden />
                  )}
                </button>

                {canAdjust && (
                  <button
                    type="button"
                    onClick={openAdjust}
                    title="Adjust avatar"
                    className="absolute top-0 right-0 z-10 flex size-7 items-center justify-center rounded-full border border-white/20 bg-muted/90 text-foreground shadow-md ring-2 ring-[#0b1021] transition-transform hover:scale-105 active:scale-95"
                  >
                    <CropIcon className="size-3" aria-hidden />
                  </button>
                )}
              </div>
            )}
          </ImagePicker>

          {/* Company Logo Section */}
          <ImagePicker
            label={images.logo ? t("images.logo.change") : t("images.logo.upload")}
            busy={busy === "logo"}
            onFiles={([file]) => file && onPick("logo", file)}
            crop
            cropTitle={`Adjust ${t("images.logo.label")}`}
            cropAspect={1}
            cropShape="rect"
            currentImageUrl={images.logo}
          >
            {({ openPicker, openAdjust, canAdjust, busy: isBusy }) => (
              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 p-2 shadow-sm backdrop-blur-md">
                <div
                  className={`size-12 shrink-0 overflow-hidden rounded-lg border border-white/10 ${
                    images.logo ? "bg-white p-1" : "flex items-center justify-center bg-muted/40"
                  }`}
                >
                  {images.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={images.logo}
                      alt="Company logo"
                      className="size-full object-contain"
                    />
                  ) : (
                    <Building2Icon className="size-5 text-muted-foreground" />
                  )}
                </div>

                <div className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-xs font-medium text-foreground">
                    {t("images.logo.label")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={openPicker}
                      className="h-6 gap-1 rounded-md px-2 text-[11px] font-medium"
                    >
                      {isBusy ? (
                        <Loader2Icon className="size-3 animate-spin" aria-hidden />
                      ) : (
                        <CameraIcon className="size-3" aria-hidden />
                      )}
                      <span>{images.logo ? t("images.change") : t("images.upload")}</span>
                    </Button>
                    {canAdjust && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={openAdjust}
                        title="Adjust logo"
                        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <CropIcon className="size-3" aria-hidden />
                        <span className="sr-only">{t("images.adjust")}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ImagePicker>
        </div>
      </div>
    </section>
  );
}
