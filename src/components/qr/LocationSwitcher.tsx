"use client";

import { useRouter } from "next/navigation";
import { ChevronDownIcon } from "@/components/ui/icons";

interface LocationSwitcherProps {
  activeId: string;
  options: { id: string; label: string }[];
}

export function LocationSwitcher({ activeId, options }: LocationSwitcherProps) {
  const router = useRouter();

  if (options.length <= 1) return null;

  return (
    <div className="relative">
      <select
        value={activeId}
        onChange={(e) => router.push(`/qr-codes?id=${e.target.value}`)}
        className="appearance-none rounded-control border border-border bg-white py-2 pl-4 pr-9 text-label text-charcoal"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/56"
      />
    </div>
  );
}
