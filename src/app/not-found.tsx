import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

// Next.js renders this for both real 404s (no matching route) and any
// explicit notFound() call in the tree — e.g. a public menu slug that
// doesn't exist.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <Link href="/" aria-label="Allergenly home" className="mb-8">
        <Logo size={34} />
      </Link>
      <p className="text-label font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-3 text-h1 text-charcoal">Page not found</h1>
      <p className="mt-3 max-w-sm text-body text-charcoal/70">
        The page you&apos;re looking for doesn&apos;t exist, or the link may be out of date.
      </p>
      <div className="mt-8">
        <ButtonLink href="/" variant="primary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
