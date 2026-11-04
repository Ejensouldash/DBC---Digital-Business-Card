import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Aurora } from "@/components/shared/aurora";
import { MobileNav, type MobileNavItem } from "@/components/shared/mobile-nav";
import { NavLinks } from "@/components/shared/nav-links";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

// Every dashboard page depends on the session, so the segment renders at request time.
export const instant = false;

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser("/dashboard");
  const t = await getTranslations("Dashboard");

  const navItems: MobileNavItem[] = [
    { href: "/dashboard", label: t("nav.overview"), icon: "overview" },
    { href: "/dashboard/profile", label: t("nav.profile"), icon: "profile" },
    { href: "/dashboard/cards", label: t("nav.cards"), icon: "cards" },
    { href: "/dashboard/leads", label: t("nav.leads"), icon: "leads" },
    { href: "/dashboard/settings", label: t("nav.settings"), icon: "settings" },
    ...(user.isAdmin ? [{ href: "/admin", label: t("nav.admin"), icon: "admin" as const }] : []),
  ];

  const desktopNav = navItems.map(({ href, label }) => ({ href, label }));

  return (
    <div className="flex min-h-full flex-col">
      <Aurora />
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="shrink-0 font-bold tracking-tight text-slate-900"
            >
              {t("brand")}
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden sm:flex">
              <NavLinks label={t("nav.label")} items={desktopNav} />
            </div>
          </div>
          <div className="shrink-0">
            <SignOutButton />
          </div>
        </div>
      </header>
      {/* Main Content with bottom padding to avoid overlapping the mobile bottom bar */}
      <main className="mx-auto w-full max-w-5xl grow px-4 py-6 pb-24 sm:py-8 sm:pb-8">
        {children}
      </main>
      {/* Mobile Bottom Navigation Bar */}
      <MobileNav items={navItems} />
    </div>
  );
}
