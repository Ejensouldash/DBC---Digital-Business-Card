import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BatchActions } from "@/features/admin/components/batch-actions";
import { CreateBatchForm } from "@/features/admin/components/create-batch-form";
import { searchBatches } from "@/features/admin/queries";
import { BATCHES_PAGE_SIZE, batchesFilterSchema } from "@/features/admin/schemas";
import { requireAdmin } from "@/lib/auth/session";

function pageHref(page: number) {
  return `/admin/batches?page=${page}`;
}

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin("/admin/batches");
  const filter = batchesFilterSchema.parse(await searchParams);
  const [t, format, { rows: batches, total }] = await Promise.all([
    getTranslations("Admin.batches"),
    getFormatter(),
    searchBatches(filter.page),
  ]);

  const pages = Math.max(1, Math.ceil(total / BATCHES_PAGE_SIZE));
  if (filter.page > pages && pages > 0) redirect(pageHref(pages));

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
        <div className="flex items-center justify-between">
          <h2 id="batches-heading" className="text-lg font-semibold">
            {t("listTitle")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {total} {total === 1 ? "batch" : "batches"}
          </span>
        </div>
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
                <TableHead className="text-right">{t("download")}</TableHead>
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
                    <BatchActions batchId={batch.id} name={batch.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {pages > 1 ? (
          <nav aria-label={t("pagination")} className="flex items-center gap-3 pt-2 text-sm">
            {filter.page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(filter.page - 1)}>{t("previous")}</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                {t("previous")}
              </Button>
            )}
            <span className="text-muted-foreground">
              {t("pageOf", { page: filter.page, pages })}
            </span>
            {filter.page < pages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(filter.page + 1)}>{t("next")}</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                {t("next")}
              </Button>
            )}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
