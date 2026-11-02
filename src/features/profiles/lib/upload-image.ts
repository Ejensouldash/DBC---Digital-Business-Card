// Browser-only: resize an image, then send it to the matching Server Action.
import { uploadProfileImage } from "../actions";
import { addProfilePhoto } from "../photo-actions";
import type { ImageKind } from "../schemas";

import { resizeImage } from "./image-resize";

const SIZES: Record<ImageKind, { maxSize: number; square?: boolean }> = {
  avatar: { maxSize: 512, square: true },
  cover: { maxSize: 1200 },
  logo: { maxSize: 256 },
};

export async function uploadImage(profileId: string, kind: ImageKind, file: File): Promise<string> {
  const formData = new FormData();
  formData.set("profileId", profileId);
  formData.set("kind", kind);
  formData.set("image", await resizeImage(file, { ...SIZES[kind], type: "image/webp" }));
  if (kind === "avatar") {
    // Small JPEG twin for the vCard photo.
    formData.set(
      "vcardPhoto",
      await resizeImage(file, { maxSize: 256, square: true, type: "image/jpeg" }),
    );
  }
  const result = await uploadProfileImage(formData);
  if (!result.ok) throw new Error(result.error);
  return result.data.url;
}

export async function uploadPhoto(
  profileId: string,
  file: File,
): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.set("profileId", profileId);
  formData.set("image", await resizeImage(file, { maxSize: 1600, type: "image/webp" }));
  const result = await addProfilePhoto(formData);
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
