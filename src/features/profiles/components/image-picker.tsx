"use client";

import { ImageUpIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ImagePickerProps = {
  label: string;
  busy: boolean;
  onFiles: (files: File[]) => void;
  multiple?: boolean;
};

// A button that opens the file picker and hands back image files (resizing and uploading
// happen in the caller).
export function ImagePicker({ label, busy, onFiles, multiple = false }: ImagePickerProps) {
  const t = useTranslations("ProfileEditor");
  const inputRef = useRef<HTMLInputElement>(null);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;
    if (files.some((file) => !file.type.startsWith("image/"))) {
      return void toast.error(t("imageInvalid"));
    }
    onFiles(files);
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2Icon className="animate-spin" aria-hidden /> : <ImageUpIcon aria-hidden />}
        {label}
      </Button>
    </>
  );
}
