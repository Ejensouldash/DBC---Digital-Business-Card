"use client";

import { DownloadIcon } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type QrDownloadButtonsProps = {
  value: string;
  filename: string;
  labels: { png: string; svg: string; failed: string };
};

function download(href: string, filename: string) {
  const anchor = Object.assign(document.createElement("a"), { href, download: filename });
  anchor.click();
}

// Print-ready QR files: PNG at 1024px for documents, SVG for print shops.
export function QrDownloadButtons({ value, filename, labels }: QrDownloadButtonsProps) {
  async function downloadPng() {
    try {
      download(await QRCode.toDataURL(value, { width: 1024, margin: 2 }), `${filename}.png`);
    } catch {
      toast.error(labels.failed);
    }
  }

  async function downloadSvg() {
    try {
      const svg = await QRCode.toString(value, { type: "svg", margin: 2 });
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      download(url, `${filename}.svg`);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      toast.error(labels.failed);
    }
  }

  return (
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
        <DownloadIcon aria-hidden />
        {labels.png}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={downloadSvg}>
        <DownloadIcon aria-hidden />
        {labels.svg}
      </Button>
    </div>
  );
}
