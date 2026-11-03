"use client";

import { QrCodeIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { normalizeProfileUrl, useClientOrigin } from "@/lib/client-origin";

import { QrCode } from "@/components/shared/qr-code";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Native share sheet where there is one (phones), otherwise copy the link.
export async function shareProfile(title: string, url: string, messages: Record<string, string>) {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
    } catch {
      // The visitor closed the share sheet.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success(messages.copied);
  } catch {
    toast.error(messages.failed);
  }
}

type ShareButtonProps = {
  displayName: string;
  profileUrl: string;
  className: string;
  children: ReactNode;
};

export function ShareButton({ displayName, profileUrl, className, children }: ShareButtonProps) {
  const t = useTranslations("Profile");
  const origin = useClientOrigin();
  const effectiveUrl = normalizeProfileUrl(profileUrl, origin);

  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        shareProfile(displayName, effectiveUrl, {
          copied: t("linkCopied"),
          failed: t("copyFailed"),
        })
      }
    >
      {children}
    </button>
  );
}

type QrButtonProps = { displayName: string; profileUrl: string; className: string };

export function QrButton({ displayName, profileUrl, className }: QrButtonProps) {
  const t = useTranslations("Profile");
  const origin = useClientOrigin();
  const effectiveUrl = normalizeProfileUrl(profileUrl, origin);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className={className}>
          <QrCodeIcon className="size-4" aria-hidden />
          {t("qr")}
        </button>
      </DialogTrigger>
      <DialogContent className="light sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("qrTitle")}</DialogTitle>
          <DialogDescription>{t("qrDescription", { name: displayName })}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <QrCode value={`${effectiveUrl}?src=qr`} label={t("qrTitle")} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
