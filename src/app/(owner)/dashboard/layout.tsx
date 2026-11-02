import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

// Every dashboard page depends on the session, so the segment renders at request time.
export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await requireUser("/dashboard");
  const t = await getTranslations("Dashboard");

  const nav = [
    { href: "/dashboard", label: t("nav.overview") },
    { href: "/dashboard/profile", label: t("nav.profile") },
  ] as const;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3">
          <Link href="/dashboard" className="mr-4 font-semibold">
            {t("brand")}
          </Link>
          <nav aria-label={t("nav.label")} className="flex gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl grow px-4 py-8">{children}</main>
    </div>
  );
}
