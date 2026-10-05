"use client";

import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button, ButtonLink } from "@/components/ui/Button";

// App Router's global error boundary — must be a Client Component.
// Catches render errors anywhere below the root layout that aren't
// already handled by a more specific error.tsx.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="mb-8">
        <Logo size={34} />
      </div>
      <p className="text-label font-semibold uppercase tracking-widest text-danger">Something went wrong</p>
      <h1 className="mt-3 text-h1 text-charcoal">We hit a snag</h1>
      <p className="mt-3 max-w-sm text-body text-charcoal/70">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </div>
  );
}
