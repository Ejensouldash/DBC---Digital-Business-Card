import { getFormatter, getTranslations } from "next-intl/server";

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
import { UserRoleButton } from "@/features/admin/components/user-role-button";
import { listUsers } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireAdmin("/admin/users");
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.slice(0, 100) : undefined;
  const [t, format, users] = await Promise.all([
    getTranslations("Admin.users"),
    getFormatter(),
    listUsers(search),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      <form method="get" role="search" className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{t("search")}</span>
          <Input
            name="q"
            type="search"
            defaultValue={search ?? ""}
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
              <TableHead className="sr-only">{t("actions")}</TableHead>
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
                    <UserRoleButton
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
    </div>
  );
}
