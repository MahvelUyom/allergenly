"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav-items";

interface AppSidebarProps {
  restaurantName: string;
  locationCount: number;
  userInitials: string;
}

// Desktop-only — below `lg` this is replaced by MobileTabBar (a fixed
// bottom bar) rather than squeezing a 260px sidebar into a phone-width
// viewport.
export function AppSidebar({ restaurantName, locationCount, userInitials }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-border bg-white lg:flex">
      <div className="flex h-[88px] items-center px-6">
        <Link href="/dashboard" aria-label="Allergenly dashboard">
          <Logo size={32} />
        </Link>
      </div>

      <nav className="flex-1 px-4 py-2">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-control px-3 py-2.5 text-label transition-colors",
                    active
                      ? "bg-primary-tint text-primary font-semibold"
                      : "text-charcoal/82 hover:bg-bg"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-control p-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-label font-semibold text-primary">
            {userInitials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-label text-charcoal">{restaurantName}</p>
            <p className="text-micro text-charcoal/56">
              {locationCount} {locationCount === 1 ? "location" : "locations"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
