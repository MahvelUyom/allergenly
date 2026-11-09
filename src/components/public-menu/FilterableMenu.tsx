"use client";

import { useMemo, useState } from "react";
import { AllergenChip, SafeChip } from "@/components/ui/AllergenChip";
import { ChevronDownIcon } from "@/components/ui/icons";
import { formatPriceCents } from "@/lib/format";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/public-menu-data";
import { cn } from "@/lib/cn";
import { MENU_FILTERS as FILTERS, listsAllergen } from "@/lib/menu-filters";
import type { MenuItemWithAllergens } from "@/types/menu";

interface FilterableMenuProps {
  items: MenuItemWithAllergens[];
}

export function FilterableMenu({ items }: FilterableMenuProps) {
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const activeFilter = FILTERS.find((f) => f.value === filter) ?? FILTERS[0];

  const grouped = useMemo(() => {
    const byCategory = new Map<string, MenuItemWithAllergens[]>();
    for (const item of items) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return CATEGORY_ORDER.filter((c) => byCategory.has(c)).map((c) => ({
      category: c,
      items: byCategory.get(c)!,
    }));
  }, [items]);

  return (
    <div>
      {/* Filter bar */}
      <div className="relative mb-8">
        <label className="mb-2 block text-label text-charcoal">Dim dishes that list:</label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-control border border-border bg-white px-4 py-3 text-body text-charcoal"
          aria-expanded={open}
        >
          {activeFilter.label}
          <ChevronDownIcon
            size={18}
            className={cn("dropdown-transition text-charcoal/56", open && "rotate-180")}
          />
        </button>

        {open && (
          <ul
            role="listbox"
            className="dropdown-transition absolute z-10 mt-2 w-full origin-top rounded-control border border-border bg-white py-2 shadow-card"
          >
            {FILTERS.map((f) => (
              <li key={f.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={filter === f.value}
                  onClick={() => {
                    setFilter(f.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-2 text-left text-body hover:bg-bg",
                    filter === f.value ? "text-primary font-medium" : "text-charcoal"
                  )}
                >
                  {f.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {activeFilter.allergens.length > 0 && (
          <p className="mt-2 text-micro text-charcoal/70">
            A dish that isn&apos;t dimmed may still contain traces or have touched this allergen in the
            kitchen. Always check with your server.
          </p>
        )}
      </div>

      {/* Menu body */}
      <div className="flex flex-col gap-10">
        {grouped.map((section) => (
          <section key={section.category}>
            <h2 className="text-h2 text-charcoal">{CATEGORY_LABELS[section.category] ?? section.category}</h2>
            <div className="mt-4 flex flex-col gap-5">
              {section.items.map((item) => {
                const dimmed = listsAllergen(item.allergens, activeFilter.allergens);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "min-h-[64px] border-b border-border pb-5 last:border-b-0 transition-opacity",
                      dimmed && "pointer-events-none opacity-40"
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-h3 text-charcoal">{item.name}</p>
                      {item.priceCents != null && (
                        <p className="shrink-0 text-label text-charcoal/70">{formatPriceCents(item.priceCents)}</p>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-1 text-body text-charcoal/70">{item.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.allergens.filter((f) => f.status !== "CLEARED").length === 0 ? (
                        <SafeChip label="No major allergens listed" />
                      ) : (
                        item.allergens
                          .filter((f) => f.status !== "CLEARED")
                          .map((flag) => (
                            <AllergenChip
                              key={flag.id}
                              allergen={flag.allergen}
                              status={flag.status}
                              mayContainWording={flag.status === "AUTO_DETECTED"}
                            />
                          ))
                      )}
                    </div>
                    {dimmed && (
                      <p className="mt-2 text-micro font-medium text-danger">
                        Lists an allergen you selected
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
