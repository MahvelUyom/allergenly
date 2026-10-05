import { cn } from "@/lib/cn";

// Checkmark Monogram — the only logo mark in the product. Per the
// design spec: never place it in a filled container with additional
// chrome, the rect/circle IS the background.
interface LogoMarkProps {
  size?: number;
  variant?: "square" | "circle";
  className?: string;
}

export function LogoMark({ size = 32, variant = "square", className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      {variant === "circle" ? (
        <circle cx="50" cy="50" r="47" fill="#0F766E" />
      ) : (
        <rect x="0" y="0" width="100" height="100" rx="20" fill="#0F766E" />
      )}
      <path
        d="M30 76 L50 22 L70 76"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 58 L47 68 L66 45"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoProps extends LogoMarkProps {
  wordmark?: boolean;
  dark?: boolean; // true = on a dark/teal background, wordmark renders white
  wordmarkClassName?: string;
}

export function Logo({
  size = 32,
  variant = "square",
  wordmark = true,
  dark = false,
  className,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} variant={variant} />
      {wordmark && (
        <span
          className={cn(
            "font-sans text-[18px] font-bold leading-none",
            dark ? "text-white" : "text-charcoal",
            wordmarkClassName
          )}
        >
          Allergenly
        </span>
      )}
    </span>
  );
}
