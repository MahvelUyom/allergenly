import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

interface MarketingFooterProps {
  activeLegal?: "terms" | "cookies";
}

export function MarketingFooter({ activeLegal }: MarketingFooterProps) {
  return (
    <footer className="bg-charcoal text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size={30} dark wordmarkClassName="text-white" />
            <p className="mt-4 max-w-xs text-body text-white/70">
              Allergen detection and QR digital menus for restaurants — free, full stop.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { href: "/#features", label: "Features" },
              { href: "/qr-codes", label: "QR Codes" },
              { href: "/dashboard", label: "Compliance Dashboard" },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { href: "/#how-it-works", label: "How it works" },
              { href: "/signup", label: "Get Started" },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { href: "/legal/terms", label: "Terms & Conditions" },
              { href: "/legal/cookie-policy", label: "Cookie Policy" },
            ]}
          />
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-micro text-white/60">© {new Date().getFullYear()} Allergenly. All rights reserved.</p>
            <div className="flex gap-6">
              <Link
                href="/legal/terms"
                className={`text-micro ${
                  activeLegal === "terms" ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                Terms
              </Link>
              <Link
                href="/legal/cookie-policy"
                className={`text-micro ${
                  activeLegal === "cookies" ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                Privacy
              </Link>
              <Link
                href="/legal/cookie-policy"
                className={`text-micro ${
                  activeLegal === "cookies" ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="text-label text-white/90">{title}</h4>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-body text-white/70 hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
