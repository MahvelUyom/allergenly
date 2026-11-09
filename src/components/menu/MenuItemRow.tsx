import { Button } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { AllergenChip, SafeChip } from "@/components/ui/AllergenChip";
import { CheckCircleIcon } from "@/components/ui/icons";
import { formatPriceCents } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MenuItemWithAllergens } from "@/types/menu";

interface MenuItemRowProps {
  item: MenuItemWithAllergens;
  active: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function MenuItemRow({ item, active, onEdit, onDelete }: MenuItemRowProps) {
  const reviewed = Boolean(item.reviewedAt);
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border px-6 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between",
        active && "bg-primary-tint"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {reviewed && (
            <span role="img" aria-label="Reviewed" title="Reviewed" className="text-success">
              <CheckCircleIcon size={18} strokeWidth={2.2} aria-hidden="true" />
            </span>
          )}
          <p className="text-label font-semibold text-charcoal">{item.name}</p>
          {item.priceCents != null && <p className="text-micro text-charcoal/56">{formatPriceCents(item.priceCents)}</p>}
          {!reviewed && <AllergenChip status="AUTO_DETECTED" label="Needs review" />}
        </div>
        {item.description && <p className="mt-1 text-micro text-charcoal/70">{item.description}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {item.allergens.length === 0 ? (
            <SafeChip label={reviewed ? "No allergens listed" : "None detected yet"} />
          ) : (
            item.allergens.map((flag) => (
              <AllergenChip key={flag.id} allergen={flag.allergen} status={flag.status} />
            ))
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant={active ? "primary" : "ghost"} size="sm" onClick={() => onEdit(item.id)}>
          {active ? "Reviewing" : reviewed ? "Edit" : "Review"}
        </Button>
        <DeleteButton label={`"${item.name}"`} onConfirm={() => onDelete(item.id)} />
      </div>
    </div>
  );
}
