import { CreditCardIcon, LayersIcon, LayoutDashboardIcon, UsersIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Aurora } from "@/components/shared/aurora";
import { MobileNav, type MobileNavItem } from "@/components/shared/mobile-nav";
import { NavLinks } from "@/components/shared/nav-links";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

// Admin pages depend on the session and role, so the segment renders at request time.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin("/admin");
  const t = await getTranslations("Admin");

  const navItems: MobileNavItem[] = [
    { href: "/admin/cards", label: t("nav.cards"), icon: CreditCardIcon },
    { href: "/admin/batches", label: t("nav.batches"), icon: LayersIcon },
    { href: "/admin/users", label: t("nav.users"), icon: UsersIcon },
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboardIcon },
  ];

  const desktopNav = navItems.map(({ href, label }) => ({ href, label }));

  return (
    <div className="flex min-h-full flex-col">
      <Aurora />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="shrink-0 font-semibold tracking-tight text-foreground">
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
      <main className="mx-auto w-full max-w-6xl grow px-4 py-6 pb-24 sm:py-8 sm:pb-8">
        {children}
      </main>
      <MobileNav items={navItems} />
    </div>
  );
}
