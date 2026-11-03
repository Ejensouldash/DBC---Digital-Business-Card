import { CalendarIcon, LayersIcon } from "lucide-react";
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
      <Card className="rounded-3xl border-white/10 bg-card/60 shadow-xl backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
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
          <h2 id="batches-heading" className="text-lg font-semibold tracking-tight">
            {t("listTitle")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {total} {total === 1 ? "batch" : "batches"}
          </span>
        </div>
        {batches.length === 0 ? (
          <p className="text-muted-foreground">{t("empty")}</p>
        ) : (
          <>
            {/* ─────────────────────────────────────────────────────────────
                1. MOBILE VIEW (< sm) - Sleek Admin Batch Cards
            ───────────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3.5 sm:hidden">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/60 p-4 shadow-lg backdrop-blur-md"
                >
                  {/* Header: Batch Name + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/admin/cards?batch=${batch.id}`}
                        className="truncate text-base font-bold text-foreground hover:underline flex items-center gap-1.5"
                      >
                        <LayersIcon className="size-4 text-primary shrink-0" />
                        <span>{batch.name}</span>
                      </Link>
                      {batch.notes ? (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {batch.notes}
                        </p>
                      ) : null}
                    </div>

                    <BatchActions batchId={batch.id} name={batch.name} />
                  </div>

                  {/* 4 Quantities Stats Pill Grid */}
                  <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-2 text-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {t("quantity")}
                      </span>
                      <span className="font-mono text-xs font-bold text-foreground">
                        {batch.quantity}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {t("unclaimed")}
                      </span>
                      <span className="font-mono text-xs font-semibold text-zinc-400">
                        {batch.unclaimed}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider">
                        {t("active")}
                      </span>
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        {batch.active}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-rose-400 uppercase tracking-wider">
                        {t("disabled")}
                      </span>
                      <span className="font-mono text-xs font-semibold text-rose-400">
                        {batch.disabled}
                      </span>
                    </div>
                  </div>

                  {/* Footer: Date */}
                  <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3 text-muted-foreground/70" />
                      <span>{format.dateTime(batch.createdAt, { dateStyle: "medium" })}</span>
                    </span>
                    <Link
                      href={`/admin/cards?batch=${batch.id}`}
                      className="text-primary hover:underline"
                    >
                      View cards →
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* ─────────────────────────────────────────────────────────────
                2. DESKTOP / LAPTOP / TABLET LANDSCAPE VIEW (100% UNTOUCHED)
            ───────────────────────────────────────────────────────────── */}
            <div className="hidden sm:block">
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
                      <TableCell>
                        {format.dateTime(batch.createdAt, { dateStyle: "medium" })}
                      </TableCell>
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
            </div>
          </>
        )}
      </section>

      {pages > 1 ? (
        <nav aria-label={t("pagination")} className="flex items-center justify-between sm:justify-start gap-3 text-sm">
          {filter.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filter.page - 1)}>{t("previous")}</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t("previous")}
            </Button>
          )}
          <span className="text-xs sm:text-sm text-muted-foreground">{t("pageOf", { page: filter.page, pages })}</span>
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
    </div>
  );
}
