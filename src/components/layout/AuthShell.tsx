import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Card } from "@/components/ui/Card";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

// §1.9 Auth shell — centered 400px card on a full-bleed #F9FAFB bg.
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col items-center">
        <Link href="/" aria-label="Allergenly home" className="mb-8">
          <Logo size={34} />
        </Link>

        <Card className="w-full p-10">
          <h1 className="text-h2 text-charcoal text-center">{title}</h1>
          <p className="mt-2 text-center text-body text-charcoal/70">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </Card>

        <div className="mt-6 text-label text-charcoal/70">{footer}</div>
      </div>
    </div>
  );
}
