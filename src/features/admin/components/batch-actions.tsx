"use client";

import { DownloadIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { useConfirm } from "@/components/shared/use-confirm";
import { Button } from "@/components/ui/button";
import { downloadTextFile } from "@/lib/download";

import { deleteCardBatch, exportBatchCsv } from "../actions";

type BatchActionsProps = {
  batchId: string;
  name: string;
};

export function BatchActions({ batchId, name }: BatchActionsProps) {
  const t = useTranslations("Admin.batches");
  const tErrors = useTranslations("Admin.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirm, confirmDialog] = useConfirm();

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportBatchCsv(batchId);
      if (!result.ok) return void toast.error(tErrors(result.error));
      downloadTextFile(result.data.csv, result.data.filename);
    });
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t("confirmDelete", { name }),
      description: t("confirmDeleteDescription"),
      confirmLabel: t("delete"),
      destructive: true,
    });
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteCardBatch(batchId);
      if (!result.ok) return void toast.error(tErrors(result.error));
      toast.success(t("deleteDone"));
      router.refresh();
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          aria-label={t("downloadFor", { name })}
          onClick={handleExport}
        >
          <DownloadIcon className="size-3.5" aria-hidden />
          CSV
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={pending}
          aria-label={t("delete")}
          onClick={handleDelete}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          {pending ? (
            <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2Icon className="size-3.5" aria-hidden />
          )}
        </Button>
      </div>
      {confirmDialog}
    </>
  );
}
