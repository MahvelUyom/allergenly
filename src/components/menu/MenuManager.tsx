"use client";

import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dropzone } from "./Dropzone";
import { ProcessingCard } from "./ProcessingCard";
import { MenuItemRow } from "./MenuItemRow";
import { OverridePanel } from "./OverridePanel";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { UploadIcon } from "@/components/ui/icons";
import type { MenuItemWithAllergens } from "@/types/menu";
import type { Allergen, AllergenStatus, Menu } from "@prisma/client";

interface MenuManagerProps {
  initialMenus: Menu[];
  initialItems: MenuItemWithAllergens[];
  publicMenuPath: string;
}

type PendingStatus = Extract<AllergenStatus, "CONFIRMED" | "CLEARED">;

const GONE_MESSAGE = "That dish had already been deleted, so it's been removed from your list.";

// The server's own reason when it gives one, so a failure says why
// (e.g. an expired login) instead of a generic "didn't save".
async function errorMessage(res: Response, fallback: string): Promise<string> {
  if (res.status === 401) return "Your session has expired. Please log in again.";
  const data = await res.json().catch(() => ({}));
  return typeof data?.error === "string" && data.error ? data.error : fallback;
}

export function MenuManager({ initialMenus, initialItems, publicMenuPath }: MenuManagerProps) {
  const searchParams = useSearchParams();
  const [menus, setMenus] = useState(initialMenus);
  const [items, setItems] = useState(initialItems);
  // Deep link from global search (?item=<id>) opens straight to that
  // item's review panel instead of landing on the plain list.
  const [activeItemId, setActiveItemId] = useState<string | null>(() => searchParams.get("item"));
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<{ menuId: string; message: string } | null>(null);
  const [publishingMenuId, setPublishingMenuId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDropzone, setShowDropzone] = useState(items.length === 0);
  // Local, unsaved allergen-toggle edits for whichever item is being
  // edited — cleared on save and on switching to a different item.
  // Keyed by item id so a save-in-flight can't get clobbered if the
  // user is quick to switch rows.
  const [pendingByItem, setPendingByItem] = useState<Record<string, Partial<Record<Allergen, PendingStatus>>>>({});
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeItem = useMemo(() => items.find((i) => i.id === activeItemId) ?? null, [items, activeItemId]);
  const activePending = activeItemId ? pendingByItem[activeItemId] ?? {} : {};

  const itemsByMenu = useMemo(() => {
    const map = new Map<string, MenuItemWithAllergens[]>();
    for (const item of items) {
      const list = map.get(item.menuId) ?? [];
      list.push(item);
      map.set(item.menuId, list);
    }
    return map;
  }, [items]);

  const handleEdit = useCallback((id: string) => {
    setReviewError(null);
    setActiveItemId((current) => (current === id ? null : id));
  }, []);

  const handleStage = useCallback((allergen: Allergen, status: PendingStatus) => {
    if (!activeItemId) return;
    setPendingByItem((prev) => ({
      ...prev,
      [activeItemId]: { ...prev[activeItemId], [allergen]: status },
    }));
  }, [activeItemId]);

  // Drop a dish from the on-screen list (after deleting it, or on finding
  // it no longer exists on the server, e.g. deleted in another tab).
  const removeItemLocally = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setActiveItemId((cur) => (cur === id ? null : cur));
    setPendingByItem((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleDeleteItem = useCallback(async (id: string) => {
    setError(null);
    const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    // 404 means it's already gone (double click, another tab): remove it
    // here too rather than leaving a dish on screen that can't be saved.
    if (res.ok || res.status === 404) {
      removeItemLocally(id);
      return;
    }
    setError(await errorMessage(res, "Couldn't delete that dish. Please try again."));
  }, [removeItemLocally]);

  const handleDeleteMenu = useCallback(
    async (menuId: string) => {
      setError(null);
      const res = await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        setError(await errorMessage(res, "Couldn't delete that menu. Please try again."));
        return;
      }
      const deletedItemIds = new Set(items.filter((i) => i.menuId === menuId).map((i) => i.id));
      setMenus((prev) => prev.filter((m) => m.id !== menuId));
      setItems((prev) => prev.filter((i) => i.menuId !== menuId));
      setActiveItemId((cur) => (cur && deletedItemIds.has(cur) ? null : cur));
      setShowDropzone((prev) => prev || items.length - deletedItemIds.size === 0);
    },
    [items]
  );

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setUploadingFile(file.name);
    setProgress(8);

    // Simulated incremental progress while the pipeline runs
    // server-side — real per-step progress would come from polling a
    // status endpoint once processing moves to a background job (see
    // lib/menu-processing.ts's doc comment).
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 12 : p));
    }, 220);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/menus/upload", { method: "POST", body: formData });

      if (progressTimer.current) clearInterval(progressTimer.current);
      setProgress(100);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Upload failed");
        setTimeout(() => setUploadingFile(null), 400);
        return;
      }

      const data = await res.json();
      setTimeout(() => {
        // The upload always lands on the restaurant's first menu (see
        // lib/menu-processing.ts) — merge its fresh item list in and
        // make sure that menu is represented in the grouped view even
        // if this was the very first upload.
        const menuId: string | undefined = data.upload?.menuId;
        setItems((prev) => {
          const withoutThatMenu = menuId ? prev.filter((i) => i.menuId !== menuId) : prev;
          return [...withoutThatMenu, ...data.items];
        });
        if (menuId) {
          setMenus((prev) =>
            prev.some((m) => m.id === menuId)
              ? prev
              : [...prev, (data.menu ?? { id: menuId, name: "Menu", status: "DRAFT" }) as Menu]
          );
        }
        setUploadingFile(null);
        setShowDropzone(false);
      }, 400);
    } catch {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setError("Upload failed — please try again");
      setUploadingFile(null);
    }
  }, []);

  // Returns true when every staged edit saved.
  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!activeItemId) return false;
    const edits = Object.entries(pendingByItem[activeItemId] ?? {}) as [Allergen, PendingStatus][];
    if (edits.length === 0) return true;

    setSaving(true);
    setReviewError(null);
    try {
      // Commit every staged toggle for this item, then apply the
      // server's response for each in turn — the API always returns
      // the item's full current allergen list, so the final write
      // wins and there's no risk of merging stale partial state.
      let latestItem: MenuItemWithAllergens | null = null;
      let failure: string | null = null;
      for (const [allergen, status] of edits) {
        const res = await fetch(`/api/menu-items/${activeItemId}/allergens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allergen, status }),
        });
        if (res.status === 404) {
          // The dish no longer exists (deleted elsewhere): stop retrying it.
          removeItemLocally(activeItemId);
          setError(GONE_MESSAGE);
          return false;
        }
        if (res.ok) {
          const data = await res.json();
          latestItem = data.item as MenuItemWithAllergens;
        } else if (!failure) {
          failure = await errorMessage(res, "Some changes didn't save. Please try again.");
        }
      }
      if (latestItem) {
        const finalItem = latestItem;
        setItems((prev) => prev.map((i) => (i.id === activeItemId ? finalItem : i)));
      }
      if (failure) {
        setReviewError(failure);
        return false;
      }
      setPendingByItem((prev) => {
        const next = { ...prev };
        delete next[activeItemId];
        return next;
      });
      return true;
    } catch {
      setReviewError("Some changes didn't save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [activeItemId, pendingByItem, removeItemLocally]);

  const handleMarkReviewed = useCallback(async () => {
    if (!activeItemId) return;
    setSaving(true);
    setReviewError(null);
    try {
      const res = await fetch(`/api/menu-items/${activeItemId}/review`, { method: "POST" });
      if (res.status === 404) {
        removeItemLocally(activeItemId);
        setError(GONE_MESSAGE);
        return;
      }
      if (!res.ok) {
        setReviewError(await errorMessage(res, "Couldn't mark this dish as reviewed. Please try again."));
        return;
      }
      const data = await res.json();
      const next = items.map((i) => (i.id === activeItemId ? (data.item as MenuItemWithAllergens) : i));
      setItems(next);
      // Move straight on to the next dish on the same menu that still
      // needs a review, so staff can work down the list.
      const current = next.find((i) => i.id === activeItemId);
      const sameMenu = next.filter((i) => i.menuId === current?.menuId);
      const idx = sameMenu.findIndex((i) => i.id === activeItemId);
      const nextUnreviewed =
        sameMenu.slice(idx + 1).find((i) => !i.reviewedAt) ?? sameMenu.find((i) => !i.reviewedAt);
      setActiveItemId(nextUnreviewed?.id ?? null);
    } catch {
      setReviewError("Couldn't mark this dish as reviewed. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [activeItemId, items, removeItemLocally]);

  const handleSaveAndReview = useCallback(async () => {
    if (await handleSave()) await handleMarkReviewed();
  }, [handleSave, handleMarkReviewed]);

  const handlePublish = useCallback(async (menuId: string, published: boolean) => {
    setPublishingMenuId(menuId);
    setPublishError(null);
    try {
      const res = await fetch(`/api/menus/${menuId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMenus((prev) => prev.map((m) => (m.id === menuId ? { ...m, ...data.menu } : m)));
      } else {
        setPublishError({ menuId, message: data.error || "Couldn't update your menu. Please try again." });
      }
    } catch {
      setPublishError({ menuId, message: "Couldn't update your menu. Please try again." });
    } finally {
      setPublishingMenuId(null);
    }
  }, []);

  const menusWithItems = menus.filter((m) => (itemsByMenu.get(m.id)?.length ?? 0) > 0);

  return (
    <div className="flex flex-col gap-6">
      {items.length > 0 && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" onClick={() => setShowDropzone((v) => !v)}>
            <UploadIcon size={16} />
            {showDropzone ? "Hide upload" : "Upload another menu"}
          </Button>
        </div>
      )}

      {(showDropzone || items.length === 0) && (
        <Dropzone onFile={handleFile} disabled={!!uploadingFile} />
      )}

      {uploadingFile && <ProcessingCard fileName={uploadingFile} progress={progress} />}
      {error && <p className="text-label text-danger">{error}</p>}

      {menusWithItems.map((menu) => {
        const menuItems = itemsByMenu.get(menu.id) ?? [];
        const unreviewed = menuItems.filter((i) => !i.reviewedAt).length;
        const published = menu.status === "PUBLISHED";
        return (
          <Card key={menu.id} className="overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-border bg-bg px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-label font-semibold text-charcoal">
                  {published ? "Live: diners can see this menu" : "Not live yet"}
                </p>
                <p className="mt-1 text-micro text-charcoal/70">
                  {published
                    ? unreviewed > 0
                      ? `Diners can't see ${unreviewed} ${unreviewed === 1 ? "dish" : "dishes"} until reviewed.`
                      : "Diners can see every dish below."
                    : unreviewed > 0
                    ? `Review ${unreviewed} more ${unreviewed === 1 ? "dish" : "dishes"} to publish. Diners can't see this menu until then.`
                    : "Every dish is reviewed. Publish to make this menu visible to diners."}
                </p>
                {publishError?.menuId === menu.id && (
                  <p className="mt-2 text-micro font-medium text-danger">{publishError.message}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-3">
                {published && (
                  <ButtonLink href={publicMenuPath} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm">
                    View menu
                  </ButtonLink>
                )}
                <Button
                  size="sm"
                  variant={published ? "secondary" : "primary"}
                  disabled={publishingMenuId === menu.id || (!published && unreviewed > 0)}
                  onClick={() => handlePublish(menu.id, !published)}
                >
                  {published ? "Unpublish" : "Publish menu"}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
              <div>
                <h3 className="text-h3 text-charcoal">
                  {menu.name} · {menuItems.length}
                </h3>
              </div>
              {/* flex-wrap here too — once DeleteButton is confirming it's
                  a full bordered bar, not a small icon, so it needs to be
                  free to drop to its own line rather than fight the
                  legend for space on one row. */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-4 text-micro text-charcoal/56">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full border border-dashed border-amber" /> Auto-detected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-danger" /> Confirmed
                  </span>
                </div>
                <DeleteButton
                  label={`"${menu.name}" and all ${menuItems.length} item${menuItems.length === 1 ? "" : "s"} in it`}
                  onConfirm={() => handleDeleteMenu(menu.id)}
                />
              </div>
            </div>
            <div>
              {menuItems.map((item) => (
                <Fragment key={item.id}>
                  <MenuItemRow
                    item={item}
                    active={item.id === activeItemId}
                    onEdit={handleEdit}
                    onDelete={handleDeleteItem}
                  />
                  {activeItem && activeItem.id === item.id && (
                    <div className="border-b border-border bg-bg p-4">
                      <OverridePanel
                        item={activeItem}
                        pending={activePending}
                        onStage={handleStage}
                        onSave={handleSave}
                        onMarkReviewed={handleMarkReviewed}
                        onSaveAndReview={handleSaveAndReview}
                        saving={saving}
                        error={reviewError}
                      />
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
