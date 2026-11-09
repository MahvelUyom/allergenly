"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AllergenChip, SafeChip } from "@/components/ui/AllergenChip";
import { EU14_ALLERGENS, allergenLabel } from "@/lib/allergens";
import { cn } from "@/lib/cn";
import type { MenuItemWithAllergens } from "@/types/menu";
import type { Allergen, AllergenStatus } from "@prisma/client";

type PendingStatus = Extract<AllergenStatus, "CONFIRMED" | "CLEARED">;
type Flag = MenuItemWithAllergens["allergens"][number];

// The row already names the allergen, so the chip states what staff decided.
const STATUS_LABELS: Record<AllergenStatus, string> = {
  AUTO_DETECTED: "Detected",
  CONFIRMED: "Present",
  CLEARED: "Not present",
};

interface OverridePanelProps {
  item: MenuItemWithAllergens;
  /** Local, unsaved edits keyed by allergen — the server hasn't seen these yet. */
  pending: Partial<Record<Allergen, PendingStatus>>;
  onStage: (allergen: Allergen, nextStatus: PendingStatus) => void;
  onSave: () => void;
  onMarkReviewed: () => void;
  /** Saves staged edits and marks the dish reviewed in one step. */
  onSaveAndReview: () => void;
  saving?: boolean;
  error?: string | null;
}

// Clicking a row cycles it: not flagged/auto-detected → Confirmed → Cleared →
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

export function OverridePanel({
  item,
  pending,
  onStage,
  onSave,
  onMarkReviewed,
  onSaveAndReview,
  saving,
  error,
}: OverridePanelProps) {
  // Explicit tuple return type — without it, `.map(f => [f.allergen, f])`
  // infers a plain (Allergen | Flag)[] array rather than a [Allergen,
  // Flag] tuple, which makes `new Map(...)` fall back to Map<{}, {}>.
  const flagByAllergen = new Map<Allergen, Flag>(item.allergens.map((f): [Allergen, Flag] => [f.allergen, f]));
  const hasPending = Object.keys(pending).length > 0;
  // Detected allergens nobody has decided on yet, counting unsaved clicks.
  const undecided = EU14_ALLERGENS.filter(
    (a) => flagByAllergen.get(a)?.status === "AUTO_DETECTED" && pending[a] === undefined
  );
  const undecidedNames = undecided.map(allergenLabel).join(", ");

  return (
    <Card className="border-[1.5px] border-primary p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-h3 text-charcoal">Editing: {item.name}</h3>
          <p className="mt-1 text-micro text-charcoal/56">
            Automatic detection can miss allergens, so check all 14 against the recipe. Click an allergen to
            mark it present, and click again to mark it not present.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onSave} disabled={!hasPending || saving} className="shrink-0">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EU14_ALLERGENS.map((allergen) => {
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
                <AllergenChip status={displayStatus} label={STATUS_LABELS[displayStatus]} />
              ) : (
                <SafeChip label="Not flagged" />
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

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-micro text-charcoal/70">
          {item.reviewedAt ? (
            <p>Reviewed. Changing an allergen hides this dish from your public menu until you review it again.</p>
          ) : undecided.length > 0 ? (
            <>
              <p className="font-medium text-charcoal">
                Still to decide: <span className="text-danger">{undecidedNames}</span>
              </p>
              <p className="mt-1">
                These were detected automatically. Click each one once for present, or twice for not present.
              </p>
            </>
          ) : (
            <p>Marking this reviewed confirms your staff checked this dish against all 14 allergens.</p>
          )}
        </div>
        {!item.reviewedAt && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {undecided.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                disabled={saving}
                onClick={() => undecided.forEach((a) => onStage(a, "CONFIRMED"))}
              >
                Mark all detected as present
              </Button>
            )}
            <Button
              size="sm"
              disabled={saving || undecided.length > 0}
              onClick={hasPending ? onSaveAndReview : onMarkReviewed}
            >
              {hasPending ? "Save & mark reviewed" : "Mark reviewed"}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-micro font-medium text-danger">{error}</p>}
    </Card>
  );
}
