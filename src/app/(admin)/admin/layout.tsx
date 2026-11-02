import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Aurora } from "@/components/shared/aurora";
import { NavLinks } from "@/components/shared/nav-links";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { robots: { index: false } };

// Admin pages depend on the session and role, so the segment renders at request time.
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin("/admin");
  const t = await getTranslations("Admin");

  const nav = [
    { href: "/admin/cards", label: t("nav.cards") },
    { href: "/admin/batches", label: t("nav.batches") },
    { href: "/admin/users", label: t("nav.users") },
    { href: "/dashboard", label: t("nav.dashboard") },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <Aurora />
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b1a]/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3">
          <Link href="/admin" className="mr-2 shrink-0 font-semibold">
            {t("brand")}
          </Link>
          <NavLinks label={t("nav.label")} items={nav} />
          <div className="ml-auto shrink-0">
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl grow px-4 py-8">{children}</main>
    </div>
  );
}
