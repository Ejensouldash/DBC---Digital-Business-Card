"use client";

import { CropIcon, ImageUpIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { ImageCropperDialog, type AspectRatioOption } from "./image-cropper-dialog";

export type ImagePickerProps = {
  label: string;
  busy: boolean;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  crop?: boolean;
  cropTitle?: string;
  cropDescription?: string;
  cropAspect?: number;
  cropShape?: "rect" | "round";
  cropAspectOptions?: AspectRatioOption[];
  currentImageUrl?: string | null;
  allowEditCurrent?: boolean;
};

function getProxyUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

export function ImagePicker({
  label,
  busy,
  onFiles,
  multiple = false,
  crop = true,
  cropTitle,
  cropDescription,
  cropAspect = 1,
  cropShape = "rect",
  cropAspectOptions,
  currentImageUrl,
  allowEditCurrent = true,
}: ImagePickerProps) {
  const t = useTranslations("ProfileEditor");
  const inputRef = useRef<HTMLInputElement>(null);

  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("image.webp");

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      return void toast.error(t("imageInvalid"));
    }

    // If multiple files selected at once or cropping is disabled, pass through directly
    if (files.length > 1 || !crop) {
      return onFiles(files);
    }

    // For single file with crop enabled: open the cropper
    const file = files[0];
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setPendingFileName(file.name);
    setCropperOpen(true);
  }

  function onEditExisting() {
    if (!currentImageUrl) return;
    const proxied = getProxyUrl(currentImageUrl);
    setCropSrc(proxied);
    setPendingFileName("cropped-image.webp");
    setCropperOpen(true);
  }

  function handleCropComplete(croppedFile: File) {
    onFiles([croppedFile]);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onChange}
        disabled={busy}
      />

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="gap-1.5 text-xs font-medium"
        >
          {busy ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <ImageUpIcon className="size-3.5" aria-hidden />
          )}
          {label}
        </Button>

        {/* Optional quick edit/adjust button if an image is already present */}
        {allowEditCurrent && currentImageUrl && !busy && crop && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditExisting}
            title="Laraskan / Crop"
            className="gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <CropIcon className="size-3.5" aria-hidden />
            <span>Laraskan</span>
          </Button>
        )}
      </div>

      {crop && (
        <ImageCropperDialog
          open={cropperOpen}
          onOpenChange={setCropperOpen}
          imageSrc={cropSrc}
          fileName={pendingFileName}
          title={cropTitle || "Laraskan Gambar"}
          description={
            cropDescription ||
            "Gerakkan gambar untuk kedudukan yang sesuai, zoom atau rotate sebelum disimpan."
          }
          aspect={cropAspect}
          cropShape={cropShape}
          aspectOptions={cropAspectOptions}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
