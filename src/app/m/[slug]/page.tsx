import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicMenuBySlug } from "@/lib/public-menu-data";
import { FilterableMenu } from "@/components/public-menu/FilterableMenu";
import { LogoMark } from "@/components/ui/Logo";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getPublicMenuBySlug(params.slug);
  if (!data) return { title: "Menu not found" };

  const { restaurant } = data;
  // No "| Allergenly" suffix here — the root layout's title template
  // (`%s | Allergenly`) already appends it; adding it here doubled up.
  const title = `${restaurant.name} Menu — Allergen Info`;
  const description = `View the allergen-checked menu for ${restaurant.name}, powered by Allergenly. Filter dishes by allergen to find what's safe for you.`;
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${base}/m/${restaurant.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Allergenly",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicMenuPage({ params }: PageProps) {
  const data = await getPublicMenuBySlug(params.slug);
  if (!data) notFound();

  const { restaurant, menu } = data;
  const location = restaurant.locations[0];
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    url: `${base}/m/${restaurant.slug}`,
    ...(location?.address && { address: location.address }),
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: Array.from(new Set(menu.items.map((i) => i.category))).map((category) => ({
        "@type": "MenuSection",
        name: category,
        hasMenuItem: menu.items
          .filter((i) => i.category === category)
          .map((i) => ({
            "@type": "MenuItem",
            name: i.name,
            description: i.description || undefined,
            ...(i.priceCents != null && {
              offers: { "@type": "Offer", price: (i.priceCents / 100).toFixed(2), priceCurrency: "USD" },
            }),
          })),
      })),
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger -- static JSON-LD we constructed ourselves, not user HTML
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-[480px] px-5 py-10">
        <header className="flex flex-col items-center text-center">
          <LogoMark size={52} variant="circle" />
          <h1 className="mt-4 text-h1 text-charcoal">{restaurant.name}</h1>
          <p className="mt-1 text-body text-charcoal/70">
            {location?.name ?? "Menu"} · Allergen-checked menu
          </p>
        </header>

        <div className="mt-10">
          <FilterableMenu items={menu.items} />
        </div>

        <footer className="mt-14 pb-6 text-center">
          <p className="text-micro text-charcoal/56">
            Menu powered by Allergenly · Always tell your server about severe allergies
          </p>
        </footer>
      </div>
    </div>
  );
}
