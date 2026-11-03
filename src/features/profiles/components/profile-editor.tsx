"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import { ProfilePreviewDrawer } from "./profile-preview-drawer";
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
  const [previewOpen, setPreviewOpen] = useState(false);
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
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            {EDITOR_TABS.map((key) => (
              <TabsTrigger key={key} value={key}>
                {t(`tabs.${key}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Quick Live Preview button on mobile */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-full border-primary/30 px-3 text-xs font-medium text-primary shadow-sm hover:bg-primary/10 lg:hidden"
          >
            <EyeIcon className="size-3.5" aria-hidden />
            <span>{t("preview")}</span>
          </Button>
        </div>

        <TabsContent value="details">
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
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
            <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md sm:bottom-0 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
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

      {/* Desktop-only static preview mockup */}
      <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
        <PhonePreview label={t("preview")}>
          <ProfileView
            profile={preview}
            vcardUrl="#"
            profileUrl={`${profileBaseUrl}${values.slug || ""}`}
            preview
          />
        </PhonePreview>
      </aside>

      {/* Mobile-only interactive Live Preview Drawer */}
      <ProfilePreviewDrawer
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        profile={preview}
        profileUrl={`${profileBaseUrl}${values.slug || ""}`}
      />
    </div>
  );
}
