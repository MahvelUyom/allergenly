import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const restaurants = await prisma.restaurant.findMany({
    where: { menus: { some: {} } },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/cookie-policy`, changeFrequency: "yearly", priority: 0.3 },
    ...restaurants.map((r) => ({
      url: `${base}/m/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
