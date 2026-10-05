import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { MenuManager } from "@/components/menu/MenuManager";

export const metadata: Metadata = { title: "Menu Upload & Management", robots: { index: false } };

export default async function MenusPage() {
  const session = await getServerSession(authOptions);
  const restaurantId = session!.user.restaurantId!;

  const [menus, items] = await Promise.all([
    prisma.menu.findMany({
      where: { restaurantId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.menuItem.findMany({
      where: { menu: { restaurantId } },
      include: { allergens: true },
      orderBy: [{ menuId: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <div>
      <AppHeader
        title="Menu Upload & Management"
        subtitle="Upload a menu, review auto-detected allergens, and confirm before publishing."
      />
      <MenuManager initialMenus={menus} initialItems={items} />
    </div>
  );
}
