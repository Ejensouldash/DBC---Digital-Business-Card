import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BatchExportButton } from "@/features/admin/components/batch-export-button";
import { CreateBatchForm } from "@/features/admin/components/create-batch-form";
import { listBatches } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export default async function BatchesPage() {
  await requireAdmin("/admin/batches");
  const [t, format, batches] = await Promise.all([
    getTranslations("Admin.batches"),
    getFormatter(),
    listBatches(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("createTitle")}</h2>
          </CardTitle>
          <CardDescription>{t("createDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateBatchForm />
        </CardContent>
      </Card>

      <section aria-labelledby="batches-heading" className="flex flex-col gap-3">
        <h2 id="batches-heading" className="text-lg font-semibold">
          {t("listTitle")}
        </h2>
        {batches.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("createdAt")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead className="text-right">{t("unclaimed")}</TableHead>
                <TableHead className="text-right">{t("active")}</TableHead>
                <TableHead className="text-right">{t("disabled")}</TableHead>
                <TableHead className="sr-only">{t("download")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/cards?batch=${batch.id}`} className="hover:underline">
                      {batch.name}
                    </Link>
                    {batch.notes ? (
                      <p className="text-xs font-normal text-muted-foreground">{batch.notes}</p>
                    ) : null}
                  </TableCell>
                  <TableCell>{format.dateTime(batch.createdAt, { dateStyle: "medium" })}</TableCell>
                  <TableCell className="text-right tabular-nums">{batch.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{batch.unclaimed}</TableCell>
                  <TableCell className="text-right tabular-nums">{batch.active}</TableCell>
                  <TableCell className="text-right tabular-nums">{batch.disabled}</TableCell>
                  <TableCell className="text-right">
                    <BatchExportButton batchId={batch.id} name={batch.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
