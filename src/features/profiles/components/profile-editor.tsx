"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinksManager } from "@/features/links/components/links-manager";
import type { ManagedLink } from "@/features/links/queries";
import { DEFAULT_THEME } from "@/lib/profile-theme";

import { createProfile, updateProfile } from "../actions";
import {
  EDITOR_TABS,
  profileFormSchema,
  type EditorTab,
  type ImageKind,
  type ProfileFormInput,
  type ProfileFormValues,
} from "../schemas";

import { ImagesSection } from "./images-section";
import { PhonePreview } from "./phone-preview";
import { PhotoManager } from "./photo-manager";
import { ProfileFormFields } from "./profile-form-fields";
import { ProfileView, type ProfileViewData } from "./profile-view";
import { useProfileMedia, type MediaPhoto } from "./use-profile-media";

type ProfileEditorProps = {
  profileId: string | null;
  defaults: ProfileFormInput;
  images: Record<ImageKind, string | null>;
  photos: MediaPhoto[];
  links: ManagedLink[];
  profileBaseUrl: string;
  tab: EditorTab;
};

const blankToNull = (value: string | null | undefined) => (value?.trim() ? value.trim() : null);

export function ProfileEditor({
  profileId,
  defaults,
  images: initialImages,
  photos: initialPhotos,
  links,
  profileBaseUrl,
  tab,
}: ProfileEditorProps) {
  const t = useTranslations("ProfileEditor");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const media = useProfileMedia(profileId, { images: initialImages, photos: initialPhotos });
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaults,
  });
  const values = useWatch({ control: form.control });

  const text = (key: keyof ProfileFormInput) => blankToNull(values[key] as string | undefined);
  const preview: ProfileViewData = {
    displayName: values.displayName?.trim() || t("previewName"),
    jobTitle: text("jobTitle"),
    company: text("company"),
    bio: text("bio"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    email: text("email"),
    website: text("website"),
    address: text("address"),
    mapsUrl: text("mapsUrl"),
    location: text("location"),
    industry: text("industry"),
    officePhone: text("officePhone"),
    companyWebsite: text("companyWebsite"),
    avatarUrl: media.images.avatar,
    coverUrl: media.images.cover,
    companyLogoUrl: media.images.logo,
    links: links.filter((link) => link.isVisible),
    photos: media.photos,
    theme: { ...DEFAULT_THEME, ...values.theme },
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
      if (result.data?.id) {
        const uploaded = await media.uploadPending(result.data.id);
        if (!uploaded) toast.error(t("imageFailed"));
        toast.success(t("saved"));
        router.replace(`/dashboard/profile?profile=${result.data.id}`);
      } else {
        toast.success(t("saved"));
        router.refresh();
      }
    }),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
      <Tabs defaultValue={tab} className="min-w-0 gap-6">
        <TabsList>
          {EDITOR_TABS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`tabs.${key}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="details">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
            <ImagesSection
              images={media.images}
              busy={media.busy}
              pendingHint={!profileId}
              onPick={media.pickImage}
            />
            <ProfileFormFields
              control={form.control}
              slugHint={t("hints.slug", { url: `${profileBaseUrl}${values.slug || "…"}` })}
            />
            <div className="sticky bottom-0 -mx-4 border-t bg-background/90 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
              <Button type="submit" disabled={pending} className="w-full glow md:w-auto">
                {pending ? <Loader2Icon className="animate-spin" aria-hidden /> : null}
                {profileId ? t("save") : t("create")}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="links">
          {profileId ? (
            <LinksManager profileId={profileId} initialLinks={links} />
          ) : (
            <p className="text-muted-foreground">{t("linksNeedProfile")}</p>
          )}
        </TabsContent>

        <TabsContent value="photos">
          <PhotoManager
            photos={media.photos}
            busy={media.busy === "photos"}
            onAdd={media.addPhotos}
            onRemove={media.removePhoto}
          />
        </TabsContent>
      </Tabs>

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <PhonePreview label={t("preview")}>
          <ProfileView
            profile={preview}
            vcardUrl="#"
            profileUrl={`${profileBaseUrl}${values.slug || ""}`}
            preview
          />
        </PhonePreview>
      </aside>
    </div>
  );
}
