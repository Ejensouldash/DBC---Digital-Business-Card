import { CalendarIcon, GlobeIcon, LayersIcon, UserIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminCardActions } from "@/features/admin/components/admin-card-actions";
import { CardFilters } from "@/features/admin/components/card-filters";
import { listBatches, searchCards } from "@/features/admin/queries";
import { CARDS_PAGE_SIZE, cardFilterSchema, type CardFilter } from "@/features/admin/schemas";
import { requireAdmin } from "@/lib/auth/session";

function pageHref(filter: CardFilter, page: number) {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.status) params.set("status", filter.status);
  if (filter.batch) params.set("batch", filter.batch);
  params.set("page", String(page));
  return `/admin/cards?${params}`;
}

export default async function AdminCardsPage({ searchParams }: PageProps<"/admin/cards">) {
  await requireAdmin("/admin/cards");
  const filter = cardFilterSchema.parse(await searchParams);
  const [t, format, batches, { rows, total }] = await Promise.all([
    getTranslations("Admin.cards"),
    getFormatter(),
    listBatches(),
    searchCards(filter),
  ]);
  const pages = Math.max(1, Math.ceil(total / CARDS_PAGE_SIZE));
  // A stale or hand-edited ?page= past the end lands on the last page instead of an empty list.
  if (filter.page > pages) redirect(pageHref(filter, pages));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("count", { count: total })} />
      <CardFilters filter={filter} batches={batches} />
      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              1. MOBILE VIEW (< sm) - Sleek Admin Card Cards
          ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3.5 sm:hidden">
            {rows.map((card) => (
              <div
                key={card.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs"
              >
                {/* Header: Code + Status + Action Menu */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <code className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold tracking-wider text-slate-800">
                      {card.code}
                    </code>
                    <Badge variant={card.status === "active" ? "default" : "secondary"}>
                      {t(`status.${card.status}`)}
                    </Badge>
                  </div>
                  <AdminCardActions card={card} />
                </div>

                {/* Body: Owner & Profile */}
                <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-slate-50/80 p-2.5 text-xs">
                  <div className="flex items-center gap-2 text-foreground/90">
                    <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{card.ownerEmail ?? t("status.unclaimed")}</span>
                  </div>

                  {card.profileSlug ? (
                    <div className="flex items-center gap-2 text-primary">
                      <GlobeIcon className="size-3.5 shrink-0" />
                      <Link
                        href={`/p/${card.profileSlug}`}
                        target="_blank"
                        className="truncate hover:underline"
                      >
                        /p/{card.profileSlug}
                      </Link>
                    </div>
                  ) : null}
                </div>

                {/* Footer: Batch & Claimed Date */}
                <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <LayersIcon className="size-3 text-muted-foreground/70" />
                    <span className="truncate max-w-[140px]">{card.batchName ?? "—"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="size-3 text-muted-foreground/70" />
                    <span>
                      {card.claimedAt
                        ? format.dateTime(card.claimedAt, { dateStyle: "medium" })
                        : "—"}
                    </span>
                  </span>
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
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("statusFilter")}</TableHead>
                  <TableHead>{t("owner")}</TableHead>
                  <TableHead>{t("profile")}</TableHead>
                  <TableHead>{t("batchFilter")}</TableHead>
                  <TableHead>{t("claimedAt")}</TableHead>
                  <TableHead className="sr-only">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-mono text-xs">{card.code}</TableCell>
                    <TableCell>
                      <Badge variant={card.status === "active" ? "default" : "secondary"}>
                        {t(`status.${card.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate">{card.ownerEmail ?? "—"}</TableCell>
                    <TableCell>
                      {card.profileSlug ? (
                        <Link
                          href={`/p/${card.profileSlug}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          /p/{card.profileSlug}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{card.batchName ?? "—"}</TableCell>
                    <TableCell>
                      {card.claimedAt
                        ? format.dateTime(card.claimedAt, { dateStyle: "medium" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminCardActions card={card} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      {pages > 1 ? (
        <nav aria-label={t("pagination")} className="flex items-center justify-between sm:justify-start gap-3 text-sm">
          {filter.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filter, filter.page - 1)}>{t("previous")}</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t("previous")}
            </Button>
          )}
          <span className="text-xs sm:text-sm text-muted-foreground">{t("pageOf", { page: filter.page, pages })}</span>
          {filter.page < pages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filter, filter.page + 1)}>{t("next")}</Link>
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
