"use client";

import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadTextFile } from "@/lib/download";

import { exportLeadsCsv } from "../actions";

export function LeadsExportButton() {
  const t = useTranslations("Leads");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await exportLeadsCsv();
          if (!result.ok) return void toast.error(t(`errors.${result.error}`));
          downloadTextFile(result.data.csv, result.data.filename);
        })
      }
    >
      <DownloadIcon aria-hidden />
      {t("export")}
    </Button>
  );
}
