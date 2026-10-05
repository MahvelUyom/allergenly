"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useHeaderInfo } from "./HeaderContext";
import { SettingsIcon } from "@/components/ui/icons";

// The header's top-right avatar — previously showed the literal
// fallback string "AL" for every account (no name is collected at
// sign-up), which read as a meaningless stray logo. It now shows the
// account's real initials (from HeaderContext) and doubles as the
// account menu — this was also the only missing path to sign out.
export function AccountMenu() {
  const { initials, restaurantName } = useHeaderInfo();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Account menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-micro font-semibold text-white"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-56 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-border bg-white shadow-card">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-label font-semibold text-charcoal">{restaurantName}</p>
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-label text-charcoal/82 hover:bg-bg"
          >
            <SettingsIcon size={16} />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-label text-danger hover:bg-bg"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
