/**
 * Compresses and downscales high-resolution images (such as mobile camera photos)
 * before uploading to Server Actions / Gemini OCR.
 *
 * Keeps resolution high enough for crisp text recognition (max dimension 1600px),
 * while reducing typical 5-15MB phone camera files to ~200-350KB.
 */
export async function optimizeImageForOcr(
  file: File,
  maxDimension = 1600,
  quality = 0.85,
): Promise<{ file: File; dataUrl: string }> {
  // If running in SSR or an environment without canvas/image support
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof Image === "undefined"
  ) {
    return fallbackReadFile(file);
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down proportionally if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        fallbackReadFile(file).then(resolve);
        return;
      }

      // Draw white background in case source is a transparent PNG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", quality);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, dataUrl });
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const optimizedFile = new File([blob], `${baseName}-opt.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve({ file: optimizedFile, dataUrl });
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      fallbackReadFile(file).then(resolve);
    };

    img.src = objectUrl;
  });
}

async function fallbackReadFile(file: File): Promise<{ file: File; dataUrl: string }> {
  if (typeof FileReader !== "undefined") {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ file, dataUrl: (reader.result as string) || "" });
      };
      reader.onerror = () => {
        resolve({ file, dataUrl: "" });
      };
      reader.readAsDataURL(file);
    });
  }

  // Node.js / testing environment fallback
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
    return { file, dataUrl };
  } catch {
    return { file, dataUrl: "" };
  }
}
