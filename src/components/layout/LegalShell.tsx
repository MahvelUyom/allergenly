import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { MarketingFooter } from "./MarketingFooter";

export interface LegalSection {
  id: string;
  title: string;
}

interface LegalShellProps {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  activeLegal: "terms" | "cookies";
  children: React.ReactNode;
}

export function LegalShell({ title, lastUpdated, sections, activeLegal, children }: LegalShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-border">
        <div className="mx-auto flex h-20 max-w-legal items-center justify-between px-6">
          <Link href="/" aria-label="Allergenly home">
            <Logo size={32} />
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-label text-charcoal hover:text-primary">
            <ArrowLeftIcon size={16} />
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-legal flex-1 px-6 py-16">
        <h1 className="text-h1 text-charcoal">{title}</h1>
        <p className="mt-2 text-label text-charcoal/56">Last updated: {lastUpdated}</p>

        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-[240px_1fr]">
          <nav aria-label="Table of contents" className="hidden md:block">
            <ol className="sticky top-8 flex flex-col gap-3 border-l border-border pl-4">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-label text-charcoal/70 hover:text-primary">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-legalcontent text-body text-charcoal/82">{children}</div>
        </div>
      </main>

      <MarketingFooter activeLegal={activeLegal} />
    </div>
  );
}
