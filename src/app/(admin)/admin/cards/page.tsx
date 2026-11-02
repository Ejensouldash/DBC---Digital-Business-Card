import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";

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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("count", { count: total })} />
      <CardFilters filter={filter} batches={batches} />
      {rows.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
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
                  {card.claimedAt ? format.dateTime(card.claimedAt, { dateStyle: "medium" }) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <AdminCardActions card={card} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {pages > 1 ? (
        <nav aria-label={t("pagination")} className="flex items-center gap-3 text-sm">
          {filter.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filter, filter.page - 1)}>{t("previous")}</Link>
            </Button>
          ) : null}
          <span className="text-muted-foreground">{t("pageOf", { page: filter.page, pages })}</span>
          {filter.page < pages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filter, filter.page + 1)}>{t("next")}</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
