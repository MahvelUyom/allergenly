import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";

// Shared shell for every authenticated dashboard-area page. Route
// middleware already redirects unauthenticated requests to /login;
// this layout is the second line of defense and the place restaurant
// context is fetched once for the whole (app) route group.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const restaurant = await prisma.restaurant.findUnique({
    where: { ownerId: session.user.id },
    include: { _count: { select: { locations: true } } },
  });

  if (!restaurant) redirect("/login");

  const initials = (session.user.name || restaurant.name || "AL")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AppShell
      restaurantName={restaurant.name}
      locationCount={restaurant._count.locations}
      userInitials={initials}
    >
      {children}
    </AppShell>
  );
}
