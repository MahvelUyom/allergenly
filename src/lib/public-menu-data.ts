import { prisma } from "./prisma";

/**
 * Returns null when no restaurant has this slug. When the restaurant
 * exists but has nothing live yet, returns it with `menu: null`, so the
 * page can tell a diner who scanned a QR code to ask staff instead of
 * showing a dead-end 404.
 */
export async function getPublicMenuBySlug(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      locations: { take: 1, orderBy: { createdAt: "asc" } },
      menus: {
        // The first published menu that has at least one reviewed dish.
        where: { status: "PUBLISHED", items: { some: { reviewedAt: { not: null } } } },
        orderBy: { createdAt: "asc" },
        take: 1,
        include: {
          items: {
            // Diners only ever see dishes staff have reviewed. Dishes added
            // or edited after publishing stay hidden until re-reviewed.
            where: { reviewedAt: { not: null } },
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
            include: { allergens: true },
          },
        },
      },
    },
  });

  if (!restaurant) return null;

  return { restaurant, menu: restaurant.menus[0] ?? null };
}

export const CATEGORY_LABELS: Record<string, string> = {
  STARTERS: "Starters",
  MAINS: "Mains",
  DESSERTS: "Desserts",
  DRINKS: "Drinks",
  OTHER: "Menu",
};

export const CATEGORY_ORDER = ["STARTERS", "MAINS", "DESSERTS", "DRINKS", "OTHER"];
