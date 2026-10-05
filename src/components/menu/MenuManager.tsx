"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Dropzone } from "./Dropzone";
import { ProcessingCard } from "./ProcessingCard";
import { MenuItemRow } from "./MenuItemRow";
import { OverridePanel } from "./OverridePanel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { UploadIcon } from "@/components/ui/icons";
import type { MenuItemWithAllergens } from "@/types/menu";
import type { Allergen, AllergenStatus, Menu } from "@prisma/client";

interface MenuManagerProps {
  initialMenus: Menu[];
  initialItems: MenuItemWithAllergens[];
}

type PendingStatus = Extract<AllergenStatus, "CONFIRMED" | "CLEARED">;

export function MenuManager({ initialMenus, initialItems }: MenuManagerProps) {
  const searchParams = useSearchParams();
  const [menus, setMenus] = useState(initialMenus);
  const [items, setItems] = useState(initialItems);
  // Deep link from global search (?item=<id>) opens straight to that
  // item's review panel instead of landing on the plain list.
  const [activeItemId, setActiveItemId] = useState<string | null>(() => searchParams.get("item"));
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
    setActiveItemId((current) => (current === id ? null : id));
  }, []);

  const handleStage = useCallback((allergen: Allergen, status: PendingStatus) => {
    if (!activeItemId) return;
    setPendingByItem((prev) => ({
      ...prev,
      [activeItemId]: { ...prev[activeItemId], [allergen]: status },
    }));
  }, [activeItemId]);

  const handleDeleteItem = useCallback(async (id: string) => {
    const res = await fetch(`/api/menu-items/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setActiveItemId((cur) => (cur === id ? null : cur));
    setPendingByItem((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleDeleteMenu = useCallback(
    async (menuId: string) => {
      const res = await fetch(`/api/menus/${menuId}`, { method: "DELETE" });
      if (!res.ok) return;
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

    // Simulated incremental progress while the (fast, keyword-based)
    // pipeline actually runs server-side — real per-step progress would
    // come from polling a status endpoint once processing moves to a
    // background job (see lib/menu-processing.ts's doc comment).
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
          setMenus((prev) => (prev.some((m) => m.id === menuId) ? prev : [...prev, { id: menuId, name: "Menu" } as Menu]));
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

  const handleSave = useCallback(async () => {
    if (!activeItemId) return;
    const edits = Object.entries(pendingByItem[activeItemId] ?? {}) as [Allergen, PendingStatus][];
    if (edits.length === 0) return;

    setSaving(true);
    try {
      // Commit every staged toggle for this item, then apply the
      // server's response for each in turn — the API always returns
      // the item's full current allergen list, so the final write
      // wins and there's no risk of merging stale partial state.
      let latestItem: MenuItemWithAllergens | null = null;
      for (const [allergen, status] of edits) {
        const res = await fetch(`/api/menu-items/${activeItemId}/allergens`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ allergen, status }),
        });
        if (res.ok) {
          const data = await res.json();
          latestItem = data.item as MenuItemWithAllergens;
        }
      }
      if (latestItem) {
        const finalItem = latestItem;
        setItems((prev) => prev.map((i) => (i.id === activeItemId ? finalItem : i)));
      }
      setPendingByItem((prev) => {
        const next = { ...prev };
        delete next[activeItemId];
        return next;
      });
    } finally {
      setSaving(false);
    }
  }, [activeItemId, pendingByItem]);

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
        return (
          <Card key={menu.id} className="overflow-hidden p-0">
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
                <MenuItemRow
                  key={item.id}
                  item={item}
                  active={item.id === activeItemId}
                  onEdit={handleEdit}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          </Card>
        );
      })}

      {activeItem && (
        <OverridePanel
          item={activeItem}
          pending={activePending}
          onStage={handleStage}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
