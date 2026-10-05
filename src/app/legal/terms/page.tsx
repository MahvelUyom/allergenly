import type { Metadata } from "next";
import { LegalShell, type LegalSection } from "@/components/layout/LegalShell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern your use of Allergenly.",
};

const SECTIONS: LegalSection[] = [
  { id: "acceptance", title: "Acceptance of terms" },
  { id: "description", title: "Description of service" },
  { id: "registration", title: "Account registration" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "subscription", title: "Subscription & payment" },
  { id: "allergen-disclaimer", title: "Allergen data disclaimer" },
  { id: "ip", title: "Intellectual property" },
  { id: "liability", title: "Limitation of liability" },
  { id: "termination", title: "Termination" },
  { id: "governing-law", title: "Governing law" },
  { id: "changes", title: "Changes to these terms" },
  { id: "contact", title: "Contact us" },
];

export default function TermsPage() {
  return (
    <LegalShell title="Terms & Conditions" lastUpdated="September 17, 2026" sections={SECTIONS} activeLegal="terms">
      <Section id="acceptance" title="Acceptance of terms">
        <p>
          By creating an account or otherwise using Allergenly, you agree to be bound by these Terms &amp;
          Conditions. If you do not agree, please do not use the service.
        </p>
      </Section>

      <Section id="description" title="Description of service">
        <p>
          Allergenly is a free platform that helps restaurants scan uploaded menus for potential allergens,
          manage allergen information for their menu items, and generate QR-code-linked digital menus for
          customers.
        </p>
      </Section>

      <Section id="registration" title="Account registration">
        <p>
          You must provide accurate information when creating an account and are responsible for maintaining
          the confidentiality of your login credentials and for all activity under your account. Dashboard
          access is granted immediately upon sign-up.
        </p>
      </Section>

      <Section id="acceptable-use" title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Upload content you don&apos;t have the right to use.</li>
          <li>Attempt to interfere with, disrupt, or gain unauthorized access to the service.</li>
          <li>Use the service to publish false or intentionally misleading allergen information.</li>
          <li>Scrape, resell, or redistribute the platform without permission.</li>
        </ul>
      </Section>

      <Section id="subscription" title="Subscription & payment">
        <p>
          Allergenly is currently offered free of charge, in full, with no paid tiers. This clause is retained
          as standard boilerplate in case paid tiers are introduced in the future: should that happen, we will
          provide at least 30 days&apos; notice of any pricing change before it takes effect for existing accounts.
        </p>
      </Section>

      <Section id="allergen-disclaimer" title="Allergen data disclaimer">
        <p>
          <strong>
            Allergenly&apos;s automated allergen detection is a starting point, not a certification.
          </strong>{" "}
          AI- and keyword-based detection can miss allergens or flag ones that aren&apos;t actually present. Every
          auto-detected allergen must be manually reviewed and confirmed or cleared by restaurant staff before
          being relied upon. The restaurant remains solely responsible for verifying the accuracy of all
          allergen information displayed to customers, and for complying with applicable food-safety and
          labeling laws in its jurisdiction. Allergenly is a tool to assist that process, not a substitute for
          it.
        </p>
      </Section>

      <Section id="ip" title="Intellectual property">
        <p>
          Allergenly and its original content, features, and branding are owned by us and protected by
          applicable intellectual property laws. Menu content you upload remains yours; you grant us a license
          to store and display it as needed to operate the service.
        </p>
      </Section>

      <Section id="liability" title="Limitation of liability">
        <p>
          To the maximum extent permitted by law, Allergenly is provided &quot;as is&quot; without warranties of
          any kind, and we are not liable for any indirect, incidental, or consequential damages arising from
          your use of the service, including damages related to allergen exposure resulting from inaccurate or
          incomplete menu data.
        </p>
      </Section>

      <Section id="termination" title="Termination">
        <p>
          You may stop using Allergenly and close your account at any time. We may suspend or terminate access
          for accounts that violate these terms.
        </p>
      </Section>

      <Section id="governing-law" title="Governing law">
        <p>These terms are governed by the laws of the jurisdiction in which Allergenly operates, without regard to conflict-of-law principles.</p>
      </Section>

      <Section id="changes" title="Changes to these terms">
        <p>
          We may update these terms from time to time. We&apos;ll update the &quot;Last updated&quot; date above,
          and continued use of the service after changes take effect constitutes acceptance of the new terms.
        </p>
      </Section>

      <Section id="contact" title="Contact us">
        <p>
          Questions about these terms? Email us at{" "}
          <a href="mailto:legal@allergenly.app" className="text-primary underline">
            legal@allergenly.app
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 border-b border-border pb-10 pt-10 first:pt-0">
      <h2 className="text-h2 text-charcoal">{title}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}
