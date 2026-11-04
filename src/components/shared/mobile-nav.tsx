"use client";

import {
  CreditCardIcon,
  LayersIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type MobileNavIconKey =
  "overview" | "profile" | "cards" | "leads" | "settings" | "admin" | "batches" | "users";

export type MobileNavItem = {
  href: string;
  label: string;
  icon: MobileNavIconKey;
};

const ICON_MAP: Record<MobileNavIconKey, LucideIcon> = {
  overview: LayoutDashboardIcon,
  profile: UserRoundIcon,
  cards: CreditCardIcon,
  leads: UsersIcon,
  settings: SettingsIcon,
  admin: ShieldCheckIcon,
  batches: LayersIcon,
  users: UsersIcon,
};

type MobileNavProps = {
  items: MobileNavItem[];
};

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname();

  // Find most specific active link
  const activeHref = items
    .map((item) => item.href)
    .filter((href) => {
      if (href === "/dashboard" || href === "/admin") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(`${href}/`);
    })
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl shadow-lg sm:hidden"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboardIcon;
          const isActive = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isActive
                  ? "font-semibold text-teal-700"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-xl transition-all",
                  isActive
                    ? "bg-teal-50 text-teal-600 ring-1 ring-teal-500/25 shadow-xs"
                    : "text-slate-400",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </div>
              <span className="max-w-[62px] truncate text-[10px] leading-tight tracking-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
