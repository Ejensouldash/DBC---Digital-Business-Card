"use client";

import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadTextFile } from "@/lib/download";

import { exportBatchCsv } from "../actions";

export function BatchExportButton({ batchId, name }: { batchId: string; name: string }) {
  const t = useTranslations("Admin.batches");
  const tErrors = useTranslations("Admin.errors");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      aria-label={t("downloadFor", { name })}
      onClick={() =>
        startTransition(async () => {
          const result = await exportBatchCsv(batchId);
          if (!result.ok) return void toast.error(tErrors(result.error));
          downloadTextFile(result.data.csv, result.data.filename);
        })
      }
    >
      <DownloadIcon aria-hidden />
      CSV
    </Button>
  );
}
