"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/ui/icons";
import { TYPE_STYLE } from "@/components/dashboard/ActivityFeed";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { ActivityType } from "@prisma/client";

interface NotificationRow {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Unread count on first paint, so the dot is accurate before the
  // bell is ever clicked.
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleToggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await load();
      // Mark read as soon as the list is actually seen — optimistic,
      // fire-and-forget, never blocks the dropdown from opening.
      fetch("/api/notifications/read", { method: "POST" }).catch(() => undefined);
      setUnreadCount(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-charcoal/70 hover:bg-bg"
      >
        <BellIcon size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-border bg-white shadow-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-label font-semibold text-charcoal">Notifications</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-micro text-charcoal/56">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-4 py-6 text-center text-micro text-charcoal/56">You&apos;re all caught up.</p>
            )}
            {items.map((item) => {
              const style = TYPE_STYLE[item.type];
              const Icon = style.icon;
              return (
                <div
                  key={item.id}
                  className={cn("flex gap-3 border-b border-border px-4 py-3 last:border-b-0", !item.read && "bg-primary-tint/40")}
                >
                  <span className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", style.tone)}>
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-micro font-semibold text-charcoal">{item.title}</p>
                    <p className="mt-0.5 text-micro text-charcoal/70">{item.description}</p>
                    <p className="mt-1 text-micro text-charcoal/45">{relativeTime(new Date(item.createdAt))}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
