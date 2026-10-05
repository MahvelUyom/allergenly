"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AllergenChip, SafeChip } from "@/components/ui/AllergenChip";
import { CORE_ALLERGENS, allergenLabel } from "@/lib/allergens";
import { cn } from "@/lib/cn";
import type { MenuItemWithAllergens } from "@/types/menu";
import type { Allergen, AllergenStatus } from "@prisma/client";

type PendingStatus = Extract<AllergenStatus, "CONFIRMED" | "CLEARED">;
type Flag = MenuItemWithAllergens["allergens"][number];

interface OverridePanelProps {
  item: MenuItemWithAllergens;
  /** Local, unsaved edits keyed by allergen — the server hasn't seen these yet. */
  pending: Partial<Record<Allergen, PendingStatus>>;
  onStage: (allergen: Allergen, nextStatus: PendingStatus) => void;
  onSave: () => void;
  saving?: boolean;
}

// Clicking a row cycles it: Safe/auto-detected → Confirmed → Cleared →
// Confirmed → … Staff can always flip between "this allergen is
// present" and "reviewed, not present" — there's no path back to an
// un-reviewed state once a human has looked at it, which is the point
// of the review step. The cycle looks at whatever's currently showing
// (a staged edit if there is one, otherwise the server's last-known
// status), so repeated clicks step through the states predictably.
function nextStatus(current: AllergenStatus | undefined): PendingStatus {
  if (current === "CONFIRMED") return "CLEARED";
  return "CONFIRMED";
}

export function OverridePanel({ item, pending, onStage, onSave, saving }: OverridePanelProps) {
  // Explicit tuple return type — without it, `.map(f => [f.allergen, f])`
  // infers a plain (Allergen | Flag)[] array rather than a [Allergen,
  // Flag] tuple, which makes `new Map(...)` fall back to Map<{}, {}>.
  const flagByAllergen = new Map<Allergen, Flag>(item.allergens.map((f): [Allergen, Flag] => [f.allergen, f]));
  const hasPending = Object.keys(pending).length > 0;

  return (
    <Card className="border-[1.5px] border-primary p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-h3 text-charcoal">Editing: {item.name}</h3>
          <p className="mt-1 text-micro text-charcoal/56">
            Toggle each allergen to confirm or clear what Allergenly detected.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onSave} disabled={!hasPending || saving} className="shrink-0">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CORE_ALLERGENS.map((allergen) => {
          const savedFlag = flagByAllergen.get(allergen);
          const pendingStatus = pending[allergen];
          const displayStatus: AllergenStatus | undefined = pendingStatus ?? savedFlag?.status;
          const flagged = displayStatus === "AUTO_DETECTED";
          const isStaged = pendingStatus !== undefined && pendingStatus !== savedFlag?.status;

          return (
            <button
              key={allergen}
              type="button"
              disabled={saving}
              onClick={() => onStage(allergen, nextStatus(displayStatus))}
              className={cn(
                "flex items-center justify-between gap-2 rounded-control border px-4 py-3 text-left transition-colors",
                flagged
                  ? "border-danger bg-danger-tint/40"
                  : isStaged
                  ? "border-primary bg-primary-tint"
                  : "border-border hover:bg-bg"
              )}
            >
              <span className="text-label text-charcoal">{allergenLabel(allergen)}</span>
              {displayStatus ? (
                <AllergenChip allergen={allergen} status={displayStatus} />
              ) : (
                <SafeChip />
              )}
            </button>
          );
        })}
      </div>

      {hasPending && !saving && (
        <p className="mt-4 text-micro text-charcoal/56">
          {Object.keys(pending).length} unsaved {Object.keys(pending).length === 1 ? "change" : "changes"} —
          click Save changes to confirm.
        </p>
      )}
    </Card>
  );
}
