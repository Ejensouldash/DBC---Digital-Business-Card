import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginForm } from "@/features/auth/components/login-form";
import { safeNextPath } from "@/features/auth/schemas";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Login");
  return { title: t("title"), robots: { index: false } };
}

async function LoginFormWithNext({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { next } = await searchParams;
  return <LoginForm next={safeNextPath(typeof next === "string" ? next : null)} />;
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getTranslations("Login");

  return (
    <main className="mx-auto flex w-full max-w-sm grow flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-36 w-full" />}>
            <LoginFormWithNext searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
