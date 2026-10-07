"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OrDivider, GoogleButton, signInWithGoogle } from "./AuthBits";
import { signUpSchema } from "@/lib/zod-schemas";

export function SignUpForm() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = signUpSchema.safeParse({
      restaurantName,
      email,
      password,
      agreeToTerms: agree ? true : undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Something went wrong creating your account");
        setSubmitting(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (signInRes?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Input
        id="restaurantName"
        label="Restaurant name"
        placeholder="Meridian Diner"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        error={errors.restaurantName}
        autoComplete="organization"
      />
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
      <Input
        id="password"
        type="password"
        label="Password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete="new-password"
      />

      <label className="flex items-start gap-2 text-micro text-charcoal/70">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span>
          I agree to the{" "}
          <Link href="/legal/terms" className="text-primary underline">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/legal/cookie-policy" className="text-primary underline">
            Privacy Policy
          </Link>
        </span>
      </label>
      {errors.agreeToTerms && <p className="-mt-3 text-micro text-danger">{errors.agreeToTerms}</p>}

      {formError && <p className="text-micro text-danger">{formError}</p>}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Creating your account…" : "Continue"}
      </Button>

      <OrDivider />
      <GoogleButton onClick={signInWithGoogle} />
    </form>
  );
}
