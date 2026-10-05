import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

export function MarketingNav() {
  return (
    <header className="w-full border-b border-border bg-white">
      <div className="mx-auto flex h-[88px] max-w-[1440px] items-center justify-between px-6 md:px-[120px]">
        <Link href="/" aria-label="Allergenly home">
          <Logo size={34} />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/#features" className="text-label text-charcoal hover:text-primary">
            Features
          </Link>
          <Link href="/#how-it-works" className="text-label text-charcoal hover:text-primary">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-6">
          <Link href="/login" className="text-label text-charcoal hover:text-primary">
            Log in
          </Link>
          <ButtonLink href="/signup" variant="primary" size="sm">
            Get Started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
