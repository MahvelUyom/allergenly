"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";

// The mobile equivalent of AppSidebar — a thumb-reachable bottom tab
// bar instead of a hamburger + drawer, since the target audience is
// mobile-first and a drawer costs an extra tap on every navigation.
// `env(safe-area-inset-bottom)` clears the home-indicator area on
// notched iOS devices.
export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-micro",
              active ? "text-primary" : "text-charcoal/56"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
