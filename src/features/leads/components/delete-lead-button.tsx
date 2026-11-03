"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/shared/use-confirm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { deleteLead } from "../actions";

export function DeleteLeadButton({
  leadId,
  name,
  variant = "ghost",
  className,
}: {
  leadId: string;
  name: string;
  variant?: "ghost" | "outline" | "secondary";
  className?: string;
}) {
  const t = useTranslations("Leads");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, confirmDialog] = useConfirm();

  async function onDelete() {
    const confirmed = await confirm({
      title: t("confirmDelete", { name }),
      description: t("confirmDeleteDescription"),
      confirmLabel: tCommon("delete"),
      destructive: true,
    });
    if (!confirmed) return;
    startTransition(async () => {
      const result = await deleteLead(leadId);
      if (!result.ok) return void toast.error(t(`errors.${result.error}`));
      toast.success(t("deleted"));
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant={variant}
        size="icon-sm"
        disabled={pending}
        onClick={onDelete}
        aria-label={t("delete", { name })}
        className={cn(
          "text-muted-foreground/80 hover:text-destructive hover:bg-destructive/10 transition-colors",
          className,
        )}
      >
        <Trash2Icon className="size-4" aria-hidden />
      </Button>
      {confirmDialog}
    </>
  );
}
