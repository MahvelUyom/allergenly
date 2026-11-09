import type { Allergen, AllergenStatus } from "@prisma/client";

// Diner-facing allergen filters for the public menu.
//
// - Every one of the 14 allergens is reachable from some filter.
// - Nuts/peanuts and shellfish/molluscs are grouped: a diner choosing
//   "nuts" or "shellfish" expects both, so we err towards dimming more.
// - Labels name the allergen ("Gluten"), never "Gluten-free": a filter
//   can only reflect what the restaurant recorded, which isn't a
//   labelling claim we can back up.
export interface MenuFilter {
  value: string;
  label: string;
  allergens: Allergen[];
}

export const MENU_FILTERS: MenuFilter[] = [
  { value: "all", label: "No filter", allergens: [] },
  { value: "gluten", label: "Gluten", allergens: ["GLUTEN"] },
  { value: "dairy", label: "Dairy", allergens: ["MILK"] },
  { value: "eggs", label: "Eggs", allergens: ["EGGS"] },
  { value: "nuts", label: "Nuts and peanuts", allergens: ["NUTS", "PEANUTS"] },
  { value: "shellfish", label: "Shellfish and molluscs", allergens: ["CRUSTACEANS", "MOLLUSCS"] },
  { value: "fish", label: "Fish", allergens: ["FISH"] },
  { value: "soy", label: "Soy", allergens: ["SOYBEANS"] },
  { value: "sesame", label: "Sesame", allergens: ["SESAME"] },
  { value: "celery", label: "Celery", allergens: ["CELERY"] },
  { value: "mustard", label: "Mustard", allergens: ["MUSTARD"] },
  { value: "sulphites", label: "Sulphites", allergens: ["SULPHITES"] },
  { value: "lupin", label: "Lupin", allergens: ["LUPIN"] },
];

/**
 * True when a dish lists any of the given allergens. Anything staff
 * haven't cleared counts, including flags still awaiting review.
 */
export function listsAllergen(
  flags: { allergen: Allergen; status: AllergenStatus }[],
  allergens: Allergen[]
): boolean {
  return flags.some((f) => allergens.includes(f.allergen) && f.status !== "CLEARED");
}
