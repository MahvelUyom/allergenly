import { MarketingNav } from "@/components/layout/MarketingNav";
import { MarketingFooter } from "@/components/layout/MarketingFooter";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AllergenChip } from "@/components/ui/AllergenChip";
import { LogoMark } from "@/components/ui/Logo";
import {
  ShieldCheckIcon,
  UploadIcon,
  MagnifierCheckIcon,
  QrIcon,
  DashboardIcon,
  AnalyticsIcon,
} from "@/components/ui/icons";

const TRUST_BADGES = [
  "FDA allergen labeling aligned",
  "EU FIC 1169/2011 aligned",
  "HACCP-friendly workflow",
  "SOC 2 data handling",
];

const HOW_IT_WORKS = [
  {
    step: "Step 1",
    title: "Upload your menu",
    body: "Drop in a PDF, photo, or plain-text menu — Allergenly reads it, no formatting required.",
    icon: UploadIcon,
  },
  {
    step: "Step 2",
    title: "Auto-detect allergens",
    body: "Every item is scanned against the 14 EU-recognized allergens and flagged for your review.",
    icon: MagnifierCheckIcon,
  },
  {
    step: "Step 3",
    title: "Generate QR code",
    body: "Publish a mobile-friendly menu and print a QR code for tables, counters, or flyers.",
    icon: QrIcon,
  },
];

const FEATURES = [
  {
    title: "Allergen detection",
    body: "Automatic scanning against the 14 EU-recognized allergens, with a clear staff review step.",
    icon: MagnifierCheckIcon,
  },
  {
    title: "QR digital menus",
    body: "Generate unique, trackable QR codes per location or placement — no app required for diners.",
    icon: QrIcon,
  },
  {
    title: "Compliance dashboard",
    body: "A single score across every menu and location, with a clear trail of what's been reviewed.",
    icon: DashboardIcon,
  },
  {
    title: "Scan analytics",
    body: "See which QR placements are actually driving traffic, broken down by code and by day.",
    icon: AnalyticsIcon,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="text-label font-semibold uppercase tracking-widest text-primary">
            Allergen &amp; menu compliance
          </p>
          <h1 className="mt-4 text-h1 text-charcoal md:text-[40px]">
            Scan your menu for allergens. Generate QR menus in minutes.
          </h1>
          <p className="mt-6 text-body text-charcoal/70">
            Upload your menu, review AI-detected allergens, and publish a mobile-friendly QR menu
            — all in one free platform built for restaurant compliance.
          </p>
          <div className="mt-8">
            <ButtonLink href="/signup" variant="primary">
              Get Started
            </ButtonLink>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <QrIcon size={22} className="text-primary" />
            <p className="text-label text-charcoal">Table Menu — Downtown</p>
          </div>
          <div className="my-6 flex items-center justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-card border border-border bg-bg">
              <LogoMark size={44} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <MenuPreviewRow name="Grilled Salmon Bowl" price="$18" chip={<AllergenChip status="CONFIRMED" allergen="CRUSTACEANS" />} />
            <MenuPreviewRow name="Garden Herb Salad" price="$12" chip={<AllergenChip status="SAFE" />} />
          </div>
        </Card>
      </section>

      {/* Trust badges */}
      <section className="bg-bg py-14">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <p className="text-label font-semibold uppercase tracking-widest text-charcoal/56">
            Built for food-safety compliance
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 rounded-pill border border-border bg-white px-5 py-2.5 text-label text-charcoal"
              >
                <ShieldCheckIcon size={16} className="text-success" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-[1200px] px-6 py-24">
        <div className="text-center">
          <h2 className="text-h2 text-charcoal">How Allergenly works</h2>
          <p className="mt-3 text-body text-charcoal/70">Three steps from raw menu to allergen-safe QR menu.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <Card key={item.title} square elevated={false} className="p-8">
              <item.icon size={28} className="text-primary" />
              <p className="mt-6 text-label font-semibold text-primary">{item.step}</p>
              <h3 className="mt-2 text-h3 text-charcoal">{item.title}</h3>
              <p className="mt-2 text-body text-charcoal/70">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-bg py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="text-center">
            <h2 className="text-h2 text-charcoal">Everything you need to stay compliant</h2>
            <p className="mt-3 text-body text-charcoal/70">
              One platform for allergen review, digital menus, and the analytics to prove it.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title} square className="p-8">
                <feature.icon size={28} className="text-primary" />
                <h3 className="mt-6 text-h3 text-charcoal">{feature.title}</h3>
                <p className="mt-2 text-body text-charcoal/70">{feature.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-[720px] px-6 text-center">
          <h2 className="text-h2 text-white">Ready to make your menu allergen-safe?</h2>
          <p className="mt-3 text-body text-white/85">
            Free to use, full stop — no card required to get started.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink href="/signup" variant="white">
              Get Started Free
            </ButtonLink>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function MenuPreviewRow({ name, price, chip }: { name: string; price: string; chip: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-border px-4 py-3">
      <div>
        <p className="text-label text-charcoal">{name}</p>
        <p className="text-micro text-charcoal/56">{price}</p>
      </div>
      {chip}
    </div>
  );
}
