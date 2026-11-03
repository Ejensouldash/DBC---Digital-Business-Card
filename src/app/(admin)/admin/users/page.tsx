import { CalendarIcon, CreditCardIcon, SparklesIcon } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserActions } from "@/features/admin/components/user-actions";
import { searchUsers } from "@/features/admin/queries";
import { USERS_PAGE_SIZE, usersFilterSchema } from "@/features/admin/schemas";
import { requireAdmin } from "@/lib/auth/session";

function pageHref(q: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("page", String(page));
  return `/admin/users?${params}`;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = await requireAdmin("/admin/users");
  const filter = usersFilterSchema.parse(await searchParams);
  const [t, format, { rows: users, total }] = await Promise.all([
    getTranslations("Admin.users"),
    getFormatter(),
    searchUsers({ q: filter.q, page: filter.page }),
  ]);

  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  if (filter.page > pages && pages > 0) redirect(pageHref(filter.q, pages));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={`${t("description")} (${total} ${total === 1 ? "user" : "users"})`}
      />
      <form method="get" role="search" className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm sm:flex-initial">
          <span className="text-xs font-semibold sm:text-sm sm:font-medium">{t("search")}</span>
          <Input
            name="q"
            type="search"
            defaultValue={filter.q ?? ""}
            placeholder="name@example.com"
            className="w-full sm:w-64"
          />
        </label>
        <Button type="submit" size="sm">
          {t("apply")}
        </Button>
      </form>

      {users.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <>
          {/* ─────────────────────────────────────────────────────────────
              1. MOBILE VIEW (< sm) - Sleek Admin User Cards
          ───────────────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3.5 sm:hidden">
            {users.map((user) => {
              const isAdmin = user.role === "admin";
              const userInitial = user.name?.trim().charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();

              return (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/60 p-4 shadow-lg backdrop-blur-md"
                >
                  {/* Header: User Info & Role Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-indigo-600/30 text-sm font-bold text-primary ring-1 ring-primary/30 shadow-inner">
                        {userInitial}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-base font-semibold text-foreground">
                          {user.name || "—"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <Badge variant={isAdmin ? "default" : "secondary"}>
                      {isAdmin ? t("admin") : t("owner")}
                    </Badge>
                  </div>

                  {/* Metrics & Joined Date */}
                  <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <SparklesIcon className="size-3 text-primary" />
                        <span>
                          {user.profiles} {t("profiles")}
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCardIcon className="size-3 text-cyan-400" />
                        <span>
                          {user.cards} {t("cards")}
                        </span>
                      </span>
                    </div>

                    <span className="flex items-center gap-1 text-[11px]">
                      <CalendarIcon className="size-3 text-muted-foreground/70" />
                      <span>{format.dateTime(user.createdAt, { dateStyle: "medium" })}</span>
                    </span>
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t border-white/5 pt-2">
                    <UserActions
                      userId={user.id}
                      email={user.email}
                      isAdmin={isAdmin}
                      isSelf={user.id === admin.id}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              2. DESKTOP / LAPTOP / TABLET LANDSCAPE VIEW (100% UNTOUCHED)
          ───────────────────────────────────────────────────────────── */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("user")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                  <TableHead className="text-right">{t("profiles")}</TableHead>
                  <TableHead className="text-right">{t("cards")}</TableHead>
                  <TableHead>{t("joined")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isAdmin = user.role === "admin";
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <p className="font-medium">{user.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isAdmin ? "default" : "secondary"}>
                          {isAdmin ? t("admin") : t("owner")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{user.profiles}</TableCell>
                      <TableCell className="text-right tabular-nums">{user.cards}</TableCell>
                      <TableCell>
                        {format.dateTime(user.createdAt, { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActions
                          userId={user.id}
                          email={user.email}
                          isAdmin={isAdmin}
                          isSelf={user.id === admin.id}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {pages > 1 ? (
        <nav aria-label={t("pagination")} className="flex items-center justify-between sm:justify-start gap-3 text-sm">
          {filter.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filter.q, filter.page - 1)}>{t("previous")}</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t("previous")}
            </Button>
          )}
          <span className="text-xs sm:text-sm text-muted-foreground">{t("pageOf", { page: filter.page, pages })}</span>
          {filter.page < pages ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filter.q, filter.page + 1)}>{t("next")}</Link>
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
