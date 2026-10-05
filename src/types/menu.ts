import type { MenuItem, AllergenFlag } from "@prisma/client";

export type MenuItemWithAllergens = MenuItem & { allergens: AllergenFlag[] };
