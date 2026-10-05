import { cn } from "@/lib/cn";
import { allergenLabel } from "@/lib/allergens";
import type { Allergen, AllergenStatus } from "@prisma/client";

// §1.7 Allergen Chips — the single shared component every allergen
// chip in the product (Menu Upload, QR/Public Menu, Dashboard) renders
// through, so the color mapping can never drift between screens.
export type ChipState = AllergenStatus | "SAFE";

const STATE_CLASSES: Record<ChipState, string> = {
  CONFIRMED: "bg-danger-tint text-danger border border-transparent",
  AUTO_DETECTED: "bg-transparent text-amber-text border border-dashed border-amber",
  CLEARED: "bg-success-tint text-success border border-transparent",
  SAFE: "bg-neutralchip text-neutralchip-text border border-transparent",
};

interface AllergenChipProps {
  allergen?: Allergen;
  status: ChipState;
  /** Public-menu copy uses "X (may contain)" instead of the dashboard's plain allergen name. */
  mayContainWording?: boolean;
  label?: string; // overrides the derived label entirely (e.g. "Safe for common allergens")
  className?: string;
}

export function AllergenChip({ allergen, status, mayContainWording, label, className }: AllergenChipProps) {
  const baseLabel = label ?? (allergen ? allergenLabel(allergen) : status === "SAFE" ? "Safe" : "");
  const display =
    status === "AUTO_DETECTED" && mayContainWording && allergen
      ? `${baseLabel} (may contain)`
      : status === "CLEARED" && allergen
      ? `${baseLabel} — cleared`
      : baseLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-3 py-1 text-micro font-medium leading-none",
        STATE_CLASSES[status],
        className
      )}
    >
      {display}
    </span>
  );
}

export function SafeChip({ label = "Safe", className }: { label?: string; className?: string }) {
  return <AllergenChip status="SAFE" label={label} className={className} />;
}
