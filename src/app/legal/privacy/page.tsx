import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, type LegalSection } from "@/components/layout/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What personal information Allergenly collects, why, and who processes it.",
};

const SECTIONS: LegalSection[] = [
  { id: "introduction", title: "Introduction" },
  { id: "what-we-collect", title: "What we collect" },
  { id: "how-we-use-it", title: "How we use it" },
  { id: "service-providers", title: "Service providers" },
  { id: "diners", title: "Diners using a QR menu" },
  { id: "retention", title: "How long we keep it" },
  { id: "your-rights", title: "Your choices and rights" },
  { id: "security", title: "Security" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact us" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated="November 9, 2026" sections={SECTIONS} activeLegal="privacy">
      <Section id="introduction" title="Introduction">
        <p>
          This policy explains what personal information Allergenly (&quot;we&quot;, &quot;us&quot;) collects when
          restaurants use our platform and when diners view a menu through a QR code, what we do with it, and who
          else processes it on our behalf. We do not sell personal information.
        </p>
      </Section>

      <Section id="what-we-collect" title="What we collect">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>Account details:</strong> your name and email address, and your password stored only as a
            one-way hash. If you sign in with Google, we receive your name, email address and profile picture
            from Google.
          </li>
          <li>
            <strong>Restaurant details:</strong> your restaurant&apos;s name, contact email and phone number,
            locations and addresses, and logo, if you add them.
          </li>
          <li>
            <strong>Menus:</strong> the menu files you upload, and the dishes, prices and allergen information
            extracted from them or entered by your staff, including which staff member reviewed each dish and
            when.
          </li>
          <li>
            <strong>QR scan data:</strong> when someone scans one of your QR codes we record the time, the type
            of device, the browser&apos;s user-agent string and the referring page. To avoid counting the same
            person twice within 30 minutes we store a one-way hash of the scanner&apos;s IP address and
            user-agent. We do not store the IP address itself.
          </li>
          <li>
            <strong>Cookies:</strong> see our <Link href="/legal/cookie-policy" className="text-primary underline">Cookie Policy</Link>.
          </li>
        </ul>
      </Section>

      <Section id="how-we-use-it" title="How we use it">
        <ul className="list-disc space-y-3 pl-5">
          <li>To create and secure your account and keep you signed in.</li>
          <li>To read your uploaded menus, flag likely allergens for your staff to review, and publish your menu.</li>
          <li>To show you scan analytics for your QR codes.</li>
          <li>To send service emails, such as password reset links.</li>
          <li>To keep the service working, secure and free of abuse.</li>
        </ul>
      </Section>

      <Section id="service-providers" title="Service providers">
        <p>We rely on these providers to run Allergenly. They process data only to provide their service to us:</p>
        <ul className="list-disc space-y-3 pl-5">
          <li><strong>Vercel:</strong> hosting, and cookieless site analytics and performance monitoring.</li>
          <li><strong>Our database and file storage providers:</strong> storing your account, menus and uploaded files.</li>
          <li>
            <strong>Google (Gemini API):</strong> uploaded menu files are sent to Google&apos;s AI service to read
            the menu and suggest likely allergens.
          </li>
          <li><strong>Google (sign-in):</strong> if you choose &quot;Continue with Google&quot;.</li>
          <li><strong>Microsoft Outlook:</strong> sending service emails such as password resets.</li>
        </ul>
        <p>
          Some of these providers may process data outside your country. We may also disclose information if the
          law requires it.
        </p>
      </Section>

      <Section id="diners" title="Diners using a QR menu">
        <p>
          You don&apos;t need an account to view a menu. Beyond the QR scan data described above, we don&apos;t
          collect personal information from diners. The allergen filter runs in your browser, and we don&apos;t
          record which allergens you select.
        </p>
      </Section>

      <Section id="retention" title="How long we keep it">
        <p>
          We keep account, restaurant and menu information while your account is open. If you ask us to delete
          your account, we delete your restaurant, its menus, QR codes and scan history with it.
        </p>
      </Section>

      <Section id="your-rights" title="Your choices and rights">
        <p>
          You can update your account and restaurant details in Settings at any time. To get a copy of your
          information, correct it, or have your account deleted, email us at the address below. Depending on
          where you live, you may have further rights under local data protection law, including the right to
          complain to a regulator.
        </p>
      </Section>

      <Section id="security" title="Security">
        <p>
          Passwords are hashed, connections are encrypted, and each restaurant can only access its own data. No
          system is perfectly secure, so please use a strong password and tell us about anything suspicious.
        </p>
      </Section>

      <Section id="changes" title="Changes to this policy">
        <p>
          We may update this policy from time to time. We&apos;ll update the &quot;Last updated&quot; date above,
          and tell account holders about significant changes.
        </p>
      </Section>

      <Section id="contact" title="Contact us">
        <p>
          Questions or requests about your information? Email us at{" "}
          <a href="mailto:allergenly@gmail.com" className="text-primary underline">
            allergenly@gmail.com
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
