"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type MobileNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#070b1a]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === activeHref;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isActive
                  ? "font-medium text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-xl transition-all",
                  isActive
                    ? "bg-primary/20 text-primary shadow-[0_0_12px_rgba(124,58,237,0.3)] ring-1 ring-primary/40"
                    : "text-muted-foreground",
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
