"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type NavLinksProps = { label: string; items: { href: string; label: string }[] };

// Top navigation for the dashboard and admin areas; highlights the current section.
export function NavLinks({ label, items }: NavLinksProps) {
  const pathname = usePathname();
  // The most specific matching href wins, so "/dashboard" isn't active on "/dashboard/links".
  const active = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav aria-label={label} className="-mx-2 flex gap-1 overflow-x-auto px-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.href === active ? "page" : undefined}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap text-slate-600 transition-all outline-none hover:bg-slate-100/80 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/50",
            item.href === active &&
              "bg-teal-50 font-semibold text-teal-800 border border-teal-200/70 shadow-2xs",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
