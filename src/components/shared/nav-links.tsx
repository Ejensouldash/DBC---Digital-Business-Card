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
            "rounded-lg px-2.5 py-1 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-white/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
            item.href === active &&
              "bg-white/10 font-medium text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.1)] ring-1 ring-white/15",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
