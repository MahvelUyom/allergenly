import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/layout/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your menus and QR codes."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary">
            Sign up
          </Link>
        </>
      }
    >
      {/* LoginForm reads ?callbackUrl via useSearchParams(), which
          requires a Suspense boundary for Next.js to statically
          prerender this page — without it, `next build` fails outright
          (only surfaces at build time, never in `next dev`). */}
      <Suspense fallback={<div className="h-[340px]" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
