import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

// §1.6 Buttons — one component, every variant from the design system.
export type ButtonVariant =
  | "primary"
  | "secondary"
  | "white"
  | "outline-white"
  | "ghost"
  | "google"
  | "danger";

// Every variant sets its OWN font-weight utility (never two on the same
// element — Tailwind's cascade order for same-property utilities is
// determined by its internal theme order, not className order, so
// stacking font-medium + font-semibold on one button is ambiguous).
// Per §1.6: buttons are weight 600, except the Google OAuth button at 500.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white border border-primary hover:bg-primary-hover hover:border-primary-hover font-semibold",
  secondary:
    "bg-transparent text-primary border border-primary hover:bg-primary-tint font-semibold",
  white: "bg-white text-primary border border-white hover:bg-primary-tint font-semibold",
  "outline-white":
    "bg-transparent text-white border border-white/60 hover:bg-white/10 font-semibold",
  ghost: "bg-transparent text-charcoal border border-border hover:bg-bg font-semibold",
  google: "bg-white text-charcoal border border-border hover:bg-bg font-medium",
  danger:
    "bg-danger text-white border border-danger hover:bg-danger-hover hover:border-danger-hover font-semibold",
};

interface BaseProps {
  variant?: ButtonVariant;
  size?: "md" | "sm";
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
};

// Plain font-size only (no weight) — each variant supplies its own
// font-weight utility above, so these intentionally don't reuse the
// text-label/text-micro classes (which carry their own fixed weight).
const sizeClasses = {
  md: "px-6 py-3 text-[14px] leading-none",
  sm: "px-5 py-2.5 text-[12px] leading-none",
};

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-control font-sans transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(baseClasses, sizeClasses[size], VARIANT_CLASSES[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: LinkProps) {
  return (
    <Link
      href={href}
      className={cn(baseClasses, sizeClasses[size], VARIANT_CLASSES[variant], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
