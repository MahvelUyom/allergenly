"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OrDivider, GoogleButton, signInWithGoogle } from "./AuthBits";
import { loginSchema } from "@/lib/zod-schemas";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0] as string] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const res = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (res?.ok) {
      router.push(searchParams.get("callbackUrl") || "/dashboard");
      router.refresh();
    } else {
      setFormError("Incorrect email or password");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Input
        id="email"
        type="email"
        label="Work email"
        placeholder="you@restaurant.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
      />
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-label text-charcoal">
            Password
          </label>
          <Link href="/forgot-password" className="text-micro text-primary">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />
      </div>

      {formError && <p className="text-micro text-danger">{formError}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Logging in…" : "Log in"}
      </Button>

      <OrDivider />
      <GoogleButton onClick={signInWithGoogle} />
    </form>
  );
}
