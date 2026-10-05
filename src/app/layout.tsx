import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SessionProviderClient } from "@/components/providers/SessionProviderClient";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Allergenly — Allergen scanning & QR menus for restaurants",
    template: "%s | Allergenly",
  },
  description:
    "Scan your menu for allergens and generate QR digital menus in minutes. Free, full stop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProviderClient>
          {children}
          <CookieConsent />
        </SessionProviderClient>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
