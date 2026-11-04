"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormTextField } from "@/components/shared/form-text-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";

import { createProfile } from "../actions";
import { EMPTY_PROFILE } from "../lib/form-defaults";
import { uploadImage } from "../lib/upload-image";
import { quickProfileSchema, type QuickProfileInput, type QuickProfileValues } from "../schemas";

import { ImagePicker } from "./image-picker";

type Picked = { file: File; url: string };

// Creates the first profile, photo and cover included, in one step.
export function QuickProfileForm({ name, email }: { name: string; email: string }) {
  const t = useTranslations("Dashboard.onboarding");
  const tEditor = useTranslations("ProfileEditor");
  const router = useRouter();
  const [avatar, setAvatar] = useState<Picked | null>(null);
  const [cover, setCover] = useState<Picked | null>(null);
  const form = useForm<QuickProfileInput, unknown, QuickProfileValues>({
    resolver: zodResolver(quickProfileSchema),
    defaultValues: { displayName: name, slug: "", jobTitle: "" },
  });

  const pick = (set: (picked: Picked) => void) => (files: File[]) => {
    const [file] = files;
    if (file) set({ file, url: URL.createObjectURL(file) });
  };

  const onSubmit = form.handleSubmit(async () => {
    const result = await createProfile({ ...EMPTY_PROFILE, email, ...form.getValues() });
    if (!result.ok) {
      if (result.error === "slug_taken") form.setError("slug", { message: "slugTaken" });
      toast.error(tEditor(`errors.${result.error}`));
      return;
    }
    const uploads = [
      avatar && uploadImage(result.data.id, "avatar", avatar.file),
      cover && uploadImage(result.data.id, "cover", cover.file),
    ].filter((upload) => upload !== null);
    const settled = await Promise.allSettled(uploads);
    if (settled.some((upload) => upload.status === "rejected")) toast.error(tEditor("imageFailed"));
    toast.success(t("created"));
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="relative h-32 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200 sm:h-36">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- local preview
          <img src={cover.url} alt="" className="size-full object-cover" />
        ) : null}
        <div className="absolute right-2 bottom-2 z-10">
          <ImagePicker
            label={t("cover")}
            busy={false}
            onFiles={pick(setCover)}
            crop
            cropTitle="Adjust Cover / Banner"
            cropAspect={3}
            cropAspectOptions={[
              { label: "3:1 (Banner)", value: 3 },
              { label: "16:9", value: 16 / 9 },
              { label: "4:3", value: 4 / 3 },
              { label: "1:1", value: 1 },
            ]}
            currentImageUrl={cover?.url}
          />
        </div>
        <div className="absolute bottom-2 left-3 z-10 flex items-end gap-2">
          <div className="size-16 overflow-hidden rounded-full bg-slate-200 ring-4 ring-white shadow-xs">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- local preview
              <img src={avatar.url} alt="" className="size-full object-cover" />
            ) : null}
          </div>
          <ImagePicker
            label={t("photo")}
            busy={false}
            onFiles={pick(setAvatar)}
            crop
            cropTitle="Adjust Profile Photo"
            cropAspect={1}
            cropShape="round"
            currentImageUrl={avatar?.url}
          />
        </div>
      </div>
      <FieldGroup className="gap-4 sm:grid sm:grid-cols-2">
        <FormTextField
          control={form.control}
          name="displayName"
          label={tEditor("fields.displayName")}
          autoComplete="name"
        />
        <FormTextField control={form.control} name="jobTitle" label={tEditor("fields.jobTitle")} />
        <div className="sm:col-span-2">
          <FormTextField
            control={form.control}
            name="slug"
            label={tEditor("fields.slug")}
            description={t("slugHint")}
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>
      </FieldGroup>
      <div>
        <Button
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="sheen h-12 rounded-xl px-6 glow"
        >
          {form.formState.isSubmitting ? (
            <Loader2Icon className="animate-spin" aria-hidden />
          ) : (
            <SparklesIcon aria-hidden />
          )}
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}
