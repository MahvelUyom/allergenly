"use client";

import { useState } from "react";
import { TrashIcon } from "./icons";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

interface DeleteButtonProps {
  onConfirm: () => void | Promise<void>;
  /** Fills "Delete {label}?" — e.g. "this item" or "this menu and all its items". */
  label: string;
  className?: string;
}

// Two-step confirm (trash icon -> a bordered/tinted confirm bar with
// real Confirm/Cancel buttons) instead of a native confirm() dialog, so
// the destructive action still gets a deliberate second click without a
// modal. Confirm/Cancel are real Button components, not plain text
// links — a destructive action reads as an afterthought when it's just
// underlined text sitting next to unrelated label copy.
export function DeleteButton({ onConfirm, label, className }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (confirming) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-control border border-danger/30 bg-danger-tint px-4 py-2.5",
          className
        )}
      >
        <span className="text-label font-medium text-charcoal">Delete {label}?</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onConfirm();
              setBusy(false);
              setConfirming(false);
            }}
          >
            {busy ? "Deleting…" : "Confirm delete"}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Delete ${label}`}
      onClick={() => setConfirming(true)}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-charcoal/45 hover:bg-danger/10 hover:text-danger",
        className
      )}
    >
      <TrashIcon size={16} />
    </button>
  );
}
