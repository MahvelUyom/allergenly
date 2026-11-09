import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// Rebuilt hourly rather than frozen at build time, so newly published
// menus show up without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Only restaurants with a live menu: published, with at least one reviewed dish.
  const restaurants = await prisma.restaurant.findMany({
    where: { menus: { some: { status: "PUBLISHED", items: { some: { reviewedAt: { not: null } } } } } },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/cookie-policy`, changeFrequency: "yearly", priority: 0.3 },
    ...restaurants.map((r) => ({
      url: `${base}/m/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
