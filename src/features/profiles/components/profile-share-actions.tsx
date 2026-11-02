"use client";

import { QrCodeIcon, Share2Icon, UserPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ProfileShareActionsProps = {
  displayName: string;
  vcardUrl: string;
  profileUrl: string;
};

export function ProfileShareActions({
  displayName,
  vcardUrl,
  profileUrl,
}: ProfileShareActionsProps) {
  const t = useTranslations("Profile");
  const qrUrl = `${profileUrl}?src=qr`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: displayName, url: profileUrl });
      } catch {
        // The visitor closed the share sheet.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button asChild size="lg" className="sheen h-12 w-full rounded-xl text-base glow">
        <a href={vcardUrl}>
          <UserPlusIcon aria-hidden />
          {t("saveContact")}
        </a>
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="lg" className="h-11 lift rounded-xl" onClick={share}>
          <Share2Icon aria-hidden />
          {t("share")}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="lg" className="h-11 lift rounded-xl">
              <QrCodeIcon aria-hidden />
              {t("qr")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("qrTitle")}</DialogTitle>
              <DialogDescription>{t("qrDescription", { name: displayName })}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-2">
              <QrCode value={qrUrl} label={t("qrTitle")} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
