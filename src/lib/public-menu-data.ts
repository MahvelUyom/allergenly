import { prisma } from "./prisma";

export async function getPublicMenuBySlug(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      locations: { take: 1, orderBy: { createdAt: "asc" } },
      menus: {
        where: { status: "PUBLISHED" },
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

  if (!restaurant || restaurant.menus.length === 0 || restaurant.menus[0].items.length === 0) return null;

  return { restaurant, menu: restaurant.menus[0] };
}

export const CATEGORY_LABELS: Record<string, string> = {
  STARTERS: "Starters",
  MAINS: "Mains",
  DESSERTS: "Desserts",
  DRINKS: "Drinks",
  OTHER: "Menu",
};

export const CATEGORY_ORDER = ["STARTERS", "MAINS", "DESSERTS", "DRINKS", "OTHER"];
