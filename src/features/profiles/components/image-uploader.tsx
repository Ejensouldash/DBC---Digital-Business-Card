"use client";

import { ImageUpIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { uploadProfileImage } from "../actions";
import { resizeImage } from "../lib/image-resize";
import type { ImageKind } from "../schemas";

type ImageUploaderProps = {
  profileId: string;
  kind: ImageKind;
  onUploaded: (url: string) => void;
};

async function buildUpload(file: File, profileId: string, kind: ImageKind): Promise<FormData> {
  const formData = new FormData();
  formData.set("profileId", profileId);
  formData.set("kind", kind);
  if (kind === "avatar") {
    formData.set(
      "image",
      await resizeImage(file, { maxSize: 512, square: true, type: "image/webp" }),
    );
    formData.set(
      "vcardPhoto",
      await resizeImage(file, { maxSize: 256, square: true, type: "image/jpeg" }),
    );
  } else {
    formData.set("image", await resizeImage(file, { maxSize: 1200, type: "image/webp" }));
  }
  return formData;
}

export function ImageUploader({ profileId, kind, onUploaded }: ImageUploaderProps) {
  const t = useTranslations("ProfileEditor");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error(t("imageInvalid"));

    setPending(true);
    try {
      const result = await uploadProfileImage(await buildUpload(file, profileId, kind));
      if (!result.ok) throw new Error(result.error);
      onUploaded(result.data.url);
      toast.success(t("imageUploaded"));
    } catch {
      toast.error(t("imageFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onChange}
        disabled={pending}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? (
          <Loader2Icon className="animate-spin" aria-hidden />
        ) : (
          <ImageUpIcon aria-hidden />
        )}
        {kind === "avatar" ? t("changeAvatar") : t("changeCover")}
      </Button>
    </div>
  );
}
