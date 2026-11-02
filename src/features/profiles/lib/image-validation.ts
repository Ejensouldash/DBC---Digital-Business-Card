const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type ImageFormat = "webp" | "jpg";

export const IMAGE_CONTENT_TYPES: Record<ImageFormat, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
};

// Trust the bytes, not the browser-supplied MIME type.
export function sniffImageFormat(bytes: Uint8Array): ImageFormat | null {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (isJpeg) return "jpg";
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

export async function readImage(
  file: FormDataEntryValue | null,
  allowed: readonly ImageFormat[],
): Promise<{ bytes: Uint8Array; format: ImageFormat } | null> {
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_IMAGE_BYTES) return null;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = sniffImageFormat(bytes);
  return format && allowed.includes(format) ? { bytes, format } : null;
}
