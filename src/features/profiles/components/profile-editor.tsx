"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { createProfile, updateProfile } from "../actions";
import { profileFormSchema, type ProfileFormInput, type ProfileFormValues } from "../schemas";

import { ImageUploader } from "./image-uploader";
import { ProfileFormFields } from "./profile-form-fields";
import { ProfileView, type ProfileViewData } from "./profile-view";

type ProfileEditorProps = {
  profileId: string | null;
  defaults: ProfileFormInput;
  avatarUrl: string | null;
  coverUrl: string | null;
  links: ProfileViewData["links"];
  profileBaseUrl: string;
};

const blankToNull = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

export function ProfileEditor({
  profileId,
  defaults,
  avatarUrl,
  coverUrl,
  links,
  profileBaseUrl,
}: ProfileEditorProps) {
  const t = useTranslations("ProfileEditor");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [images, setImages] = useState({ avatarUrl, coverUrl });
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaults,
  });
  const values = useWatch({ control: form.control });

  const preview: ProfileViewData = {
    displayName: values.displayName?.trim() || t("previewName"),
    jobTitle: blankToNull(values.jobTitle),
    company: blankToNull(values.company),
    bio: blankToNull(values.bio),
    phone: blankToNull(values.phone),
    whatsapp: blankToNull(values.whatsapp),
    email: blankToNull(values.email),
    website: blankToNull(values.website),
    address: blankToNull(values.address),
    mapsUrl: blankToNull(values.mapsUrl),
    ...images,
    links,
  };

  // Send the raw input: the server validates it again with the same schema.
  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const input = form.getValues();
      const result = profileId ? await updateProfile(profileId, input) : await createProfile(input);
      if (!result.ok) {
        if (result.error === "slug_taken") form.setError("slug", { message: "slugTaken" });
        toast.error(t(`errors.${result.error}`));
        return;
      }
      toast.success(t("saved"));
      if (result.data?.id) {
        router.replace(`/dashboard/profile?profile=${result.data.id}`);
      } else {
        router.refresh();
      }
    }),
  );

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
        <section aria-labelledby="images-heading" className="flex flex-col gap-3">
          <h2 id="images-heading" className="font-medium">
            {t("sections.images")}
          </h2>
          {profileId ? (
            <div className="flex flex-wrap gap-2">
              <ImageUploader
                profileId={profileId}
                kind="avatar"
                onUploaded={(url) => setImages((s) => ({ ...s, avatarUrl: url }))}
              />
              <ImageUploader
                profileId={profileId}
                kind="cover"
                onUploaded={(url) => setImages((s) => ({ ...s, coverUrl: url }))}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("saveBeforeImages")}</p>
          )}
        </section>
        <ProfileFormFields
          control={form.control}
          slugHint={t("hints.slug", { url: `${profileBaseUrl}${values.slug || "…"}` })}
        />
        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:p-0">
          <Button type="submit" disabled={pending} className="w-full md:w-auto">
            {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
            {profileId ? t("save") : t("create")}
          </Button>
        </div>
      </form>
      <aside aria-label={t("preview")} className="md:sticky md:top-6 md:self-start">
        <p className="mb-2 text-sm font-medium text-muted-foreground">{t("preview")}</p>
        <div className="mx-auto max-w-[360px]">
          <ProfileView profile={preview} preview />
        </div>
      </aside>
    </div>
  );
}
