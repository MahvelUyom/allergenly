"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon, XIcon, MenuIcon, QrIcon } from "@/components/ui/icons";

interface SearchResult {
  menuItems: { id: string; name: string; category: string }[];
  qrCodes: { id: string; label: string }[];
}

const EMPTY: SearchResult = { menuItems: [], qrCodes: [] };

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>(EMPTY);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) setResults(await res.json());
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
  };

  const hasResults = results.menuItems.length > 0 || results.qrCodes.length > 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Search"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal/70 hover:bg-bg"
      >
        <SearchIcon size={18} />
      </button>

      {open && (
        // Below `sm`, this takes over the full screen instead of
        // anchoring as a small dropdown — a 320px popover positioned
        // under the button could get its bottom portion covered by the
        // mobile tab bar (or run into the on-screen keyboard), which is
        // what "part of it gets hidden" was. Full-screen has no
        // positioning to get wrong. `sm:` and up restores the original
        // compact anchored dropdown.
        <div className="fixed inset-0 z-50 flex flex-col bg-white sm:absolute sm:inset-auto sm:right-0 sm:top-11 sm:z-20 sm:w-80 sm:max-w-[calc(100vw-2rem)] sm:overflow-hidden sm:rounded-card sm:border sm:border-border sm:shadow-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 sm:px-3 sm:py-2">
            <SearchIcon size={16} className="shrink-0 text-charcoal/45" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu items, QR codes…"
              className="w-full border-none bg-transparent text-label text-charcoal placeholder:text-charcoal/45 focus:outline-none"
            />
            <button
              type="button"
              aria-label="Close search"
              onClick={close}
              className="shrink-0 text-charcoal/45 hover:text-charcoal"
            >
              <XIcon size={18} className="sm:hidden" />
              <XIcon size={14} className="hidden sm:block" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto sm:max-h-96 sm:flex-none">
            {query.trim().length < 2 && (
              <p className="px-4 py-6 text-center text-micro text-charcoal/56">Type at least 2 characters…</p>
            )}
            {query.trim().length >= 2 && loading && (
              <p className="px-4 py-6 text-center text-micro text-charcoal/56">Searching…</p>
            )}
            {query.trim().length >= 2 && !loading && !hasResults && (
              <p className="px-4 py-6 text-center text-micro text-charcoal/56">No results for &quot;{query}&quot;</p>
            )}

            {results.menuItems.length > 0 && (
              <div className="border-b border-border py-1">
                <p className="px-4 py-1 text-micro font-semibold uppercase tracking-wide text-charcoal/45">
                  Menu items
                </p>
                {results.menuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      router.push(`/menus?item=${item.id}`);
                      close();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-label text-charcoal hover:bg-bg"
                  >
                    <MenuIcon size={14} className="shrink-0 text-charcoal/45" />
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            {results.qrCodes.length > 0 && (
              <div className="py-1">
                <p className="px-4 py-1 text-micro font-semibold uppercase tracking-wide text-charcoal/45">
                  QR codes
                </p>
                {results.qrCodes.map((qr) => (
                  <button
                    key={qr.id}
                    type="button"
                    onClick={() => {
                      router.push(`/qr-codes?id=${qr.id}`);
                      close();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-label text-charcoal hover:bg-bg"
                  >
                    <QrIcon size={14} className="shrink-0 text-charcoal/45" />
                    <span className="truncate">{qr.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
