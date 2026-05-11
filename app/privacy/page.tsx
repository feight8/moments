import NavHeader from "@/components/NavHeader";

export const metadata = { title: "Privacy Policy · Circa" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <NavHeader backHref="/" />

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-teal">privacy policy</h1>
          <p className="font-sans text-sm text-ink-muted">Circa Game · Operated by Charbella Games LLC</p>
          <p className="font-sans text-xs text-ink-muted">Effective Date: May 2, 2026</p>
        </div>

        <div className="space-y-8 font-sans text-sm text-ink">

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">1. Introduction</h2>
            <p className="text-ink-muted leading-relaxed">
              Charbella Games LLC (&ldquo;Charbella Games,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the Circa Game website and subscription service (collectively, the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, disclose, and safeguard information in connection with your use of the Service.
            </p>
            <p className="text-ink-muted leading-relaxed">
              By creating an account or using the Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree, please do not use the Service.
            </p>
            <p className="text-ink-muted leading-relaxed">
              This Privacy Policy is incorporated into and subject to our Terms of Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">2. Children Under 13 — COPPA Notice</h2>
            <p className="text-ink-muted leading-relaxed">
              The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. By creating an account, you represent that you are at least 13 years of age.
            </p>
            <p className="text-ink-muted leading-relaxed">
              If we learn that we have inadvertently collected personal information from a child under 13 without verifiable parental consent, we will delete that information as promptly as possible. If you believe we may have collected information from a child under 13, please contact us immediately at{" "}
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">3. Information We Collect</h2>

            <h3 className="font-semibold text-ink">3.1 Information You Provide</h3>
            <p className="text-ink-muted leading-relaxed">When you create an account, you provide us with:</p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Email address</li>
              <li>Any display name or username you choose to create</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              We do not collect your full legal name, phone number, date of birth, or physical address as part of account creation.
            </p>

            <h3 className="font-semibold text-ink">3.2 Information Collected Automatically</h3>
            <p className="text-ink-muted leading-relaxed">When you use the Service, we and our service providers automatically collect certain information, including:</p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device type and operating system</li>
              <li>Pages visited and features used within the Service</li>
              <li>Puzzle attempts, scores, and game activity</li>
              <li>Session start and end times</li>
              <li>Referring URLs</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              This information is collected through standard web server logs, cookies, and similar technologies.
            </p>

            <h3 className="font-semibold text-ink">3.3 Cookies and Similar Technologies</h3>
            <p className="text-ink-muted leading-relaxed">
              We use cookies and similar tracking technologies to maintain your login session, remember your preferences, and analyze how the Service is used. You can instruct your browser to refuse cookies, but some features of the Service may not function properly if cookies are disabled.
            </p>

            <h3 className="font-semibold text-ink">3.4 Payment Information</h3>
            <p className="text-ink-muted leading-relaxed">
              Subscription payments are processed by Stripe, Inc. We do not collect, store, or have access to your full payment card number, CVV, or other sensitive financial data. When you subscribe, Stripe provides us with limited transaction metadata such as the last four digits of your card, card type, billing country, and subscription status. All payment data is subject to{" "}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gold transition-colors">Stripe&apos;s Privacy Policy</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">4. How We Use Your Information</h2>
            <p className="text-ink-muted leading-relaxed">We use the information we collect for the following purposes:</p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>To create and manage your account</li>
              <li>To provide, operate, and improve the Service</li>
              <li>To process subscription payments and send billing-related communications</li>
              <li>To send transactional emails such as subscription confirmations, receipts, and cancellation notices</li>
              <li>To respond to your questions, comments, or support requests</li>
              <li>To monitor and analyze usage patterns to improve the Service</li>
              <li>To detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li>To enforce our Terms of Service</li>
              <li>To comply with applicable legal obligations</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              We do not use your information for behavioral advertising. We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">5. How We Share Your Information</h2>
            <p className="text-ink-muted leading-relaxed">
              We do not sell, rent, or trade your personal information. We share information only in the following limited circumstances:
            </p>

            <h3 className="font-semibold text-ink">5.1 Service Providers</h3>
            <p className="text-ink-muted leading-relaxed">We share information with third-party vendors who perform services on our behalf, including:</p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Stripe, Inc. — payment processing</li>
              <li>Supabase, Inc. — database hosting and infrastructure</li>
              <li>Vercel, Inc. — web hosting and infrastructure</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              These service providers are authorized to use your information only as necessary to provide services to us and are required to protect your information.
            </p>

            <h3 className="font-semibold text-ink">5.2 Legal Requirements</h3>
            <p className="text-ink-muted leading-relaxed">
              We may disclose your information if required to do so by law, court order, or governmental authority, or if we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a legal request.
            </p>

            <h3 className="font-semibold text-ink">5.3 Business Transfers</h3>
            <p className="text-ink-muted leading-relaxed">
              If Charbella Games LLC is involved in a merger, acquisition, or sale of all or substantially all of its assets, your information may be transferred as part of that transaction. We will provide notice before your information is transferred and becomes subject to a different privacy policy.
            </p>

            <h3 className="font-semibold text-ink">5.4 With Your Consent</h3>
            <p className="text-ink-muted leading-relaxed">
              We may share your information for any other purpose with your explicit consent.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">6. Data Retention</h2>
            <p className="text-ink-muted leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide the Service. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legitimate legal or business purposes such as resolving disputes, preventing fraud, or complying with legal obligations.
            </p>
            <p className="text-ink-muted leading-relaxed">
              Server logs and usage data may be retained in anonymized or aggregated form after account deletion.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">7. Data Security</h2>
            <p className="text-ink-muted leading-relaxed">
              We implement reasonable technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encrypted data transmission (HTTPS), access controls, and use of reputable third-party infrastructure providers.
            </p>
            <p className="text-ink-muted leading-relaxed">
              However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee the absolute security of your information. In the event of a data breach affecting your personal information, we will notify you as required by applicable law, including the Illinois Personal Information Protection Act (PIPA).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">8. Your Rights and Choices</h2>

            <h3 className="font-semibold text-ink">8.1 Account Information</h3>
            <p className="text-ink-muted leading-relaxed">
              You may review and update your account information by logging into your account settings. If you wish to delete your account, you may do so through your account settings or by contacting us at{" "}
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>.
            </p>

            <h3 className="font-semibold text-ink">8.2 Email Communications</h3>
            <p className="text-ink-muted leading-relaxed">
              You may opt out of non-transactional emails by following the unsubscribe instructions in those emails. Note that you cannot opt out of transactional emails related to your account or subscription, such as payment receipts and cancellation confirmations, as these are necessary to provide the Service.
            </p>

            <h3 className="font-semibold text-ink">8.3 Cookies</h3>
            <p className="text-ink-muted leading-relaxed">
              You may disable cookies through your browser settings. Please note that disabling cookies may affect the functionality of the Service, including your ability to remain logged in.
            </p>

            <h3 className="font-semibold text-ink">8.4 California Residents — CCPA</h3>
            <p className="text-ink-muted leading-relaxed">
              If you are a California resident, you may have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to request deletion, and the right to opt out of the &ldquo;sale&rdquo; of your personal information. We do not sell personal information. To exercise your rights, contact us at{" "}
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>.
            </p>

            <h3 className="font-semibold text-ink">8.5 Other U.S. State Privacy Laws</h3>
            <p className="text-ink-muted leading-relaxed">
              Residents of certain other states (including Virginia, Colorado, and Connecticut) may have similar privacy rights under their respective state laws. We will honor verifiable requests to access, correct, or delete your personal information regardless of your state of residence, to the extent practicable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">9. Third-Party Links</h2>
            <p className="text-ink-muted leading-relaxed">
              The Service may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">10. Changes to This Privacy Policy</h2>
            <p className="text-ink-muted leading-relaxed">
              We may update this Privacy Policy from time to time. If we make material changes, we will notify you by email (at the address associated with your account) or by a prominent notice on the Service prior to the change becoming effective. The &ldquo;Effective Date&rdquo; at the top of this policy indicates when it was last revised.
            </p>
            <p className="text-ink-muted leading-relaxed">
              Your continued use of the Service after the effective date of any changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">11. Contact Us</h2>
            <p className="text-ink-muted leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:
            </p>
            <address className="not-italic text-ink-muted leading-relaxed">
              Charbella Games LLC<br />
              Attn: Privacy<br />
              1224 W Webster Ave Apt 3F<br />
              Chicago, IL 60614<br />
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>
            </address>
            <p className="text-ink-muted leading-relaxed">
              We will respond to all privacy-related inquiries within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">12. Governing Law</h2>
            <p className="text-ink-muted leading-relaxed">
              This Privacy Policy is governed by the laws of the State of Illinois, without regard to its conflict of law provisions.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
