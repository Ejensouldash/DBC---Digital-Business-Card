"use client";

import { EyeIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ProfileView, type ProfileViewData } from "./profile-view";

type ProfilePreviewDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileViewData;
  profileUrl: string;
};

export function ProfilePreviewDrawer({
  open,
  onOpenChange,
  profile,
  profileUrl,
}: ProfilePreviewDrawerProps) {
  const t = useTranslations("ProfileEditor");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed inset-x-0 bottom-0 top-auto z-50 flex max-h-[92vh] w-full max-w-lg -translate-x-1/2 translate-y-0 flex-col overflow-hidden rounded-t-[2rem] border-x-0 border-b-0 border-t border-border bg-card p-0 shadow-2xl left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[88vh] sm:-translate-y-1/2 sm:rounded-2xl sm:border">
        {/* Drawer Drag Pill indicator for mobile */}
        <div className="mx-auto mt-2.5 h-1 w-12 rounded-full bg-slate-300 sm:hidden" />

        <DialogHeader className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-500/20">
              <EyeIcon className="size-4" aria-hidden />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                {t("livePreview")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("preview")} — {profile.displayName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable preview body styled like mobile device */}
        <div className="flex-1 overflow-y-auto bg-slate-100/80 p-3 sm:p-5">
          <div className="mx-auto max-w-sm overflow-hidden rounded-3xl border border-border bg-background shadow-xl ring-1 ring-black/5">
            <ProfileView
              profile={profile}
              vcardUrl="#"
              profileUrl={profileUrl}
              preview
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
