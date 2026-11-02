import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { NavLinks } from "@/components/shared/nav-links";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

// Every dashboard page depends on the session, so the segment renders at request time.
export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const t = await getTranslations("Dashboard");

  const nav = [
    { href: "/dashboard", label: t("nav.overview") },
    { href: "/dashboard/profile", label: t("nav.profile") },
    { href: "/dashboard/links", label: t("nav.links") },
    { href: "/dashboard/cards", label: t("nav.cards") },
    ...(user.isAdmin ? [{ href: "/admin", label: t("nav.admin") }] : []),
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3">
          <Link href="/dashboard" className="mr-2 shrink-0 font-semibold">
            {t("brand")}
          </Link>
          <NavLinks label={t("nav.label")} items={nav} />
          <div className="ml-auto shrink-0">
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl grow px-4 py-8">{children}</main>
    </div>
  );
}
