import { prisma } from "./prisma";

export async function getPublicMenuBySlug(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      locations: { take: 1, orderBy: { createdAt: "asc" } },
      menus: {
        where: { status: { in: ["PUBLISHED", "DRAFT"] } }, // draft menus are still viewable pre-launch; flip to PUBLISHED-only once a publish flow gates this
        orderBy: { createdAt: "asc" },
        take: 1,
        include: {
          items: {
            orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
            include: { allergens: true },
          },
        },
      },
    },
  });

  if (!restaurant || restaurant.menus.length === 0) return null;

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
