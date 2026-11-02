"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

// Promise-based replacement for window.confirm. Renders the app's Dialog, so it is styled and
// accessible, and works in in-app browsers (Instagram, WhatsApp) that suppress native dialogs.
// Render the returned element once; `await confirm({...})` resolves true only on the confirm button.
export function useConfirm(): [ConfirmFn, ReactNode] {
  const t = useTranslations("Common");
  const [open, setOpen] = useState(false);
  // Kept after closing so the text doesn't vanish during the close animation.
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setOpen(false);
  }, []);

  const confirm = useCallback<ConfirmFn>(
    (next) => {
      settle(false);
      setOptions(next);
      setOpen(true);
      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [settle],
  );

  const dialog = (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && settle(false)}>
      <DialogContent
        showCloseButton={false}
        // Without a description, tell Radix there is none (it warns otherwise). With one, leave
        // the prop unset: an explicit undefined would also drop Radix's own description link.
        {...(options.description ? {} : { "aria-describedby": undefined })}
      >
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
          {options.description ? (
            <DialogDescription>{options.description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => settle(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant={options.destructive ? "destructive" : "default"}
            onClick={() => settle(true)}
          >
            {options.confirmLabel ?? t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [confirm, dialog];
}
