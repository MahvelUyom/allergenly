import { MenuCategory } from "@prisma/client";
import { sanitizePlainText } from "./sanitize";

export interface ParsedMenuItem {
  name: string;
  description: string;
  priceCents: number | null;
  category: MenuCategory;
}

const CATEGORY_MAP: Record<string, MenuCategory> = {
  STARTERS: "STARTERS",
  STARTER: "STARTERS",
  APPETIZERS: "STARTERS",
  MAINS: "MAINS",
  MAIN: "MAINS",
  ENTREES: "MAINS",
  "ENTRÉES": "MAINS",
  DESSERTS: "DESSERTS",
  DESSERT: "DESSERTS",
  DRINKS: "DRINKS",
  BEVERAGES: "DRINKS",
};

const ITEM_LINE = /^(.{1,160}?)\s+\$(\d{1,4}(?:\.\d{1,2})?)\s*$/;

/**
 * Turn raw OCR/plain-text menu content into structured items. This is a
 * deliberately simple line-based heuristic parser (category headings in
 * caps, "Name  $price" lines, an optional description line beneath) —
 * it matches the shape real menu exports/OCR text commonly take, and is
 * the place to swap in a more sophisticated layout-aware parser later
 * without touching anything downstream (allergen detection & storage
 * both just consume ParsedMenuItem[]).
 */
export function parseMenuText(rawText: string): ParsedMenuItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: ParsedMenuItem[] = [];
  let currentCategory: MenuCategory = "OTHER";
  let pendingItem: ParsedMenuItem | null = null;

  const flush = () => {
    if (pendingItem) {
      items.push(pendingItem);
      pendingItem = null;
    }
  };

  for (const line of lines) {
    const upper = line.toUpperCase();
    const mappedCategory = CATEGORY_MAP[upper];
    if (mappedCategory && line === upper) {
      flush();
      currentCategory = mappedCategory;
      continue;
    }

    const itemMatch = line.match(ITEM_LINE);
    if (itemMatch) {
      flush();
      const [, rawName, rawPrice] = itemMatch;
      pendingItem = {
        name: sanitizePlainText(rawName),
        description: "",
        priceCents: Math.round(parseFloat(rawPrice) * 100),
        category: currentCategory,
      };
      continue;
    }

    // Anything else, while an item is pending, is treated as that
    // item's description line.
    if (pendingItem) {
      pendingItem.description = sanitizePlainText(
        pendingItem.description ? `${pendingItem.description} ${line}` : line
      );
    }
  }
  flush();

  return items;
}
