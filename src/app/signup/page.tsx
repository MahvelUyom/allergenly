import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/layout/AuthShell";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = { title: "Sign up", robots: { index: false } };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Create your free account. No card required."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-primary">
            Log in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
