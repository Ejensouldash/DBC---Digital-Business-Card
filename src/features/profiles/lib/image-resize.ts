// Browser-only: shrink an image before upload so the server never has to.

type ResizeOptions = {
  maxSize: number;
  // Center-crop to a square (avatars).
  square?: boolean;
  type: "image/webp" | "image/jpeg";
  quality?: number;
};

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))),
      type,
      quality,
    ),
  );
}

export async function resizeImage(
  file: Blob,
  { maxSize, square = false, type, quality = 0.85 }: ResizeOptions,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const source = square
    ? { x: (bitmap.width - side) / 2, y: (bitmap.height - side) / 2, w: side, h: side }
    : { x: 0, y: 0, w: bitmap.width, h: bitmap.height };
  const scale = Math.min(1, maxSize / Math.max(source.w, source.h));
  const width = Math.round(source.w * scale);
  const height = Math.round(source.h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");
  // JPEG has no alpha: paint white behind transparent PNGs.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, source.x, source.y, source.w, source.h, 0, 0, width, height);
  bitmap.close();

  const blob = await toBlob(canvas, type, quality);
  // Safari cannot encode WebP and silently returns PNG; fall back to JPEG.
  return blob.type === type ? blob : toBlob(canvas, "image/jpeg", quality);
}
