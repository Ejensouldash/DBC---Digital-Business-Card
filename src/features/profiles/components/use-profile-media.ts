"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { deleteProfilePhoto } from "../photo-actions";
import { MAX_PROFILE_PHOTOS, type ImageKind } from "../schemas";
import { uploadImage, uploadPhoto } from "../lib/upload-image";

export type MediaPhoto = { id: string; url: string; file?: File };
type Images = Record<ImageKind, string | null>;

// Images and gallery photos for the editor. With a saved profile, picks upload straight away.
// For a new profile they're shown from a local preview and uploaded by `uploadPending` right
// after the profile is created, so nobody has to "save first".
export function useProfileMedia(
  profileId: string | null,
  initial: { images: Images; photos: MediaPhoto[] },
) {
  const t = useTranslations("ProfileEditor");
  const [images, setImages] = useState(initial.images);
  const [pending, setPending] = useState<Partial<Record<ImageKind, File>>>({});
  const [photos, setPhotos] = useState(initial.photos);
  const [busy, setBusy] = useState<ImageKind | "photos" | null>(null);
  const uploadError = (error: unknown) =>
    error instanceof Error && error.message === "unavailable"
      ? t("imagesUnavailable")
      : t("imageFailed");

  async function pickImage(kind: ImageKind, file: File) {
    if (!profileId) {
      setImages((current) => ({ ...current, [kind]: URL.createObjectURL(file) }));
      setPending((current) => ({ ...current, [kind]: file }));
      return;
    }
    setBusy(kind);
    try {
      const url = await uploadImage(profileId, kind, file);
      setImages((current) => ({ ...current, [kind]: url }));
      toast.success(t("imageUploaded"));
    } catch (error) {
      toast.error(uploadError(error));
    } finally {
      setBusy(null);
    }
  }

  async function addPhotos(files: File[]) {
    const room = MAX_PROFILE_PHOTOS - photos.length;
    if (files.length > room) toast.error(t("photos.limit", { max: MAX_PROFILE_PHOTOS }));
    const accepted = files.slice(0, Math.max(0, room));
    if (!profileId) {
      const local = accepted.map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      }));
      setPhotos((current) => [...current, ...local]);
      return;
    }
    setBusy("photos");
    try {
      // One at a time keeps the gallery order and the server's 8-photo check simple.
      for (const file of accepted) {
        const photo = await uploadPhoto(profileId, file);
        setPhotos((current) => [...current, photo]);
      }
    } catch (error) {
      toast.error(uploadError(error));
    } finally {
      setBusy(null);
    }
  }

  async function removePhoto(photo: MediaPhoto) {
    setPhotos((current) => current.filter((p) => p.id !== photo.id));
    if (photo.file || !profileId) return;
    const result = await deleteProfilePhoto(photo.id);
    if (!result.ok) {
      toast.error(t("imageFailed"));
      setPhotos((current) => [...current, photo]);
    }
  }

  // After creating the profile: upload what was picked while it didn't exist yet.
  async function uploadPending(newProfileId: string): Promise<boolean> {
    const jobs = Object.entries(pending).flatMap(([kind, file]) =>
      file ? [uploadImage(newProfileId, kind as ImageKind, file)] : [],
    );
    const results = await Promise.allSettled(jobs);
    let ok = results.every((result) => result.status === "fulfilled");
    for (const photo of photos) {
      if (!photo.file) continue;
      ok =
        (await uploadPhoto(newProfileId, photo.file).then(
          () => true,
          () => false,
        )) && ok;
    }
    return ok;
  }

  return { images, photos, busy, pickImage, addPhotos, removePhoto, uploadPending };
}
