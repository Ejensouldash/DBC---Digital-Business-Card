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
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("search")}</span>
          <Input
            name="q"
            type="search"
            defaultValue={filter.q ?? ""}
            placeholder="name@example.com"
            className="w-64"
          />
        </label>
        <Button type="submit" size="sm">
          {t("apply")}
        </Button>
      </form>
      {users.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
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
                  <TableCell>{format.dateTime(user.createdAt, { dateStyle: "medium" })}</TableCell>
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
      )}
      {pages > 1 ? (
        <nav aria-label={t("pagination")} className="flex items-center gap-3 pt-2 text-sm">
          {filter.page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref(filter.q, filter.page - 1)}>{t("previous")}</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              {t("previous")}
            </Button>
          )}
          <span className="text-muted-foreground">{t("pageOf", { page: filter.page, pages })}</span>
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
