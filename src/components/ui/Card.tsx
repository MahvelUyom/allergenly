import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

interface CardOwnProps {
  children: React.ReactNode;
  className?: string;
  /** §1.5 section-radius exception: marketing "How it works"/"Features" cards use square corners. */
  square?: boolean;
  /** Flat/bordered (nav, dividers) vs elevated (shadow) per §1.5. */
  elevated?: boolean;
  as?: "div" | "section" | "article";
}

// Forwards any remaining div props (onClick, onDragOver, role, etc.) so
// Card can double as an interactive surface (e.g. the upload dropzone)
// without every caller reaching for a raw <div>.
type CardProps = CardOwnProps & Omit<HTMLAttributes<HTMLElement>, keyof CardOwnProps>;

export function Card({
  children,
  className,
  square = false,
  elevated = true,
  as: As = "div",
  ...rest
}: CardProps) {
  return (
    <As
      className={cn(
        "bg-white border border-border",
        square ? "rounded-none" : "rounded-card",
        elevated && "shadow-card",
        className
      )}
      {...rest}
    >
      {children}
    </As>
  );
}
