"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type QrCodeProps = { value: string; size?: number; label: string };

export function QrCode({ value, size = 240, label }: QrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => !cancelled && setDataUrl(url))
      .catch(() => !cancelled && setDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) return <Skeleton style={{ width: size, height: size }} />;
  // eslint-disable-next-line @next/next/no-img-element -- generated data URL, nothing to optimize
  return <img src={dataUrl} width={size} height={size} alt={label} className="rounded-md" />;
}
