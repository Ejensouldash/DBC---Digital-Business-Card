import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccountForm } from "@/features/account/components/delete-account-form";
import { requireUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const [user, t] = await Promise.all([
    requireUser("/dashboard/settings"),
    getTranslations("Settings"),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={t("title")} />
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>{t("account.title")}</h2>
          </CardTitle>
          <CardDescription>
            {t.rich("account.description", {
              link: (chunks) => (
                <Link href="/privacy#contact" className="underline">
                  {chunks}
                </Link>
              ),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-1 text-sm">
            <dt className="text-muted-foreground">{t("account.email")}</dt>
            <dd className="font-medium">{user.email}</dd>
          </dl>
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>
            <h2>{t("delete.title")}</h2>
          </CardTitle>
          <CardDescription>{t("delete.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
