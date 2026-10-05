import type { Metadata } from "next";
import { LegalShell, type LegalSection } from "@/components/layout/LegalShell";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Allergenly uses cookies.",
};

const SECTIONS: LegalSection[] = [
  { id: "introduction", title: "Introduction" },
  { id: "what-are-cookies", title: "What are cookies" },
  { id: "how-we-use-cookies", title: "How we use cookies" },
  { id: "types-of-cookies", title: "Types of cookies we use" },
  { id: "managing-preferences", title: "Managing your cookie preferences" },
  { id: "third-party-cookies", title: "Third-party cookies" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact us" },
];

export default function CookiePolicyPage() {
  return (
    <LegalShell title="Cookie Policy" lastUpdated="September 17, 2026" sections={SECTIONS} activeLegal="cookies">
      <Section id="introduction" title="Introduction">
        <p>
          This Cookie Policy explains how Allergenly (&quot;we&quot;, &quot;us&quot;) uses cookies and similar
          technologies when you visit our website and use our platform, including public menu pages accessed
          via a QR code scan.
        </p>
      </Section>

      <Section id="what-are-cookies" title="What are cookies">
        <p>
          Cookies are small text files placed on your device by a website you visit. They&apos;re widely used to
          make websites work, work more efficiently, and to provide information to the site owner.
        </p>
      </Section>

      <Section id="how-we-use-cookies" title="How we use cookies">
        <p>
          We use cookies to keep you signed in, remember your cookie preferences, and to understand how our
          public menu pages perform. Allergenly&apos;s site-wide analytics (Vercel Analytics and Speed Insights)
          are cookieless by design — they don&apos;t set any cookies or track individuals across sites.
        </p>
      </Section>

      <Section id="types-of-cookies" title="Types of cookies we use">
        <ul className="list-disc space-y-3 pl-5">
          <li>
            <strong>Essential:</strong> required for core functionality like signing in and keeping your session
            secure. The site cannot function properly without these.
          </li>
          <li>
            <strong>Functional:</strong> remember choices you&apos;ve made, such as your cookie-consent preference,
            so you don&apos;t have to set them again.
          </li>
          <li>
            <strong>Analytics:</strong> help us understand aggregate usage of the public menu pages (e.g. page
            performance) so we can improve them. Our default analytics provider (Vercel Analytics) does not use
            cookies.
          </li>
          <li>
            <strong>Marketing:</strong> we do not currently use marketing or advertising cookies anywhere on
            Allergenly.
          </li>
        </ul>
      </Section>

      <Section id="managing-preferences" title="Managing your cookie preferences">
        <p>
          You can choose &quot;Essential only&quot; or &quot;Accept all&quot; from the cookie banner shown on your
          first visit. You can also control cookies through your browser settings — most browsers let you block
          or delete cookies, though doing so may affect how parts of the site work.
        </p>
      </Section>

      <Section id="third-party-cookies" title="Third-party cookies">
        <p>
          If you sign in with Google, Google may set its own cookies as part of the OAuth sign-in flow. Those
          cookies are governed by Google&apos;s own privacy and cookie policies, not this one.
        </p>
      </Section>

      <Section id="changes" title="Changes to this policy">
        <p>
          We may update this Cookie Policy from time to time. We&apos;ll update the &quot;Last updated&quot; date
          above whenever we do, and material changes will be communicated where appropriate.
        </p>
      </Section>

      <Section id="contact" title="Contact us">
        <p>
          Questions about this policy? Email us at{" "}
          <a href="mailto:privacy@allergenly.app" className="text-primary underline">
            privacy@allergenly.app
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
