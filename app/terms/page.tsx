import NavHeader from "@/components/NavHeader";

export const metadata = { title: "Terms of Service · Circa" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <NavHeader backHref="/" />

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-teal">terms of service</h1>
          <p className="font-sans text-sm text-ink-muted">Circa Game · Operated by Charbella Games LLC</p>
          <p className="font-sans text-xs text-ink-muted">Effective Date: May 2, 2026</p>
        </div>

        <div className="space-y-8 font-sans text-sm text-ink">

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">1. Agreement to Terms</h2>
            <p className="text-ink-muted leading-relaxed">
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and Charbella Games LLC, an Illinois limited liability company (&ldquo;Charbella Games,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), governing your access to and use of the Circa Game website, application, and subscription service (collectively, the &ldquo;Service&rdquo;).
            </p>
            <p className="text-ink-muted leading-relaxed">
              By creating an account, subscribing, or otherwise using the Service, you agree to be bound by these Terms and our{" "}
              <a href="/privacy" className="underline hover:text-gold transition-colors">Privacy Policy</a>,
              which is incorporated herein by reference. If you do not agree to these Terms, do not use the Service.
            </p>
            <p className="text-ink-muted leading-relaxed">
              We may revise these Terms at any time. If we make material changes, we will notify you by email or by a prominent notice within the Service at least 14 days before the changes take effect. Your continued use of the Service after the effective date of any revision constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">2. Eligibility and Account Registration</h2>

            <h3 className="font-semibold text-ink">2.1 Age Requirement</h3>
            <p className="text-ink-muted leading-relaxed">
              You must be at least 13 years of age to use the Service. By creating an account, you represent and warrant that you are at least 13 years old. If you are under 18, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.
            </p>
            <p className="text-ink-muted leading-relaxed">
              The Service is not directed to children under the age of 13. If we learn that a user is under 13, we will terminate that account and delete associated personal information promptly.
            </p>

            <h3 className="font-semibold text-ink">2.2 Account Registration</h3>
            <p className="text-ink-muted leading-relaxed">To access certain features of the Service, including premium subscription features, you must create an account. You agree to:</p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Provide accurate and complete information during registration</li>
              <li>Keep your account credentials confidential and not share them with others</li>
              <li>Notify us immediately at <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a> if you suspect unauthorized access to your account</li>
              <li>Be responsible for all activity that occurs under your account</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              You may only create one account per person. We reserve the right to terminate duplicate accounts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">3. License to Use the Service</h2>
            <p className="text-ink-muted leading-relaxed">
              Subject to your compliance with these Terms and payment of any applicable subscription fees, Charbella Games grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your personal, non-commercial entertainment purposes. This license does not include the right to:
            </p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Copy, modify, distribute, sell, or lease any part of the Service</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code of the Service</li>
              <li>Scrape, crawl, or use automated tools to access or collect data from the Service</li>
              <li>Use the Service to develop a competing product or service</li>
              <li>Sublicense or transfer your rights under these Terms to any third party</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              All rights not expressly granted in these Terms are reserved by Charbella Games LLC.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">4. Subscription and Billing</h2>

            <h3 className="font-semibold text-ink">4.1 Subscription Plans</h3>
            <p className="text-ink-muted leading-relaxed">The Service offers the following paid subscription plans that unlock premium features:</p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Monthly Plan: billed once per month</li>
              <li>Annual Plan: billed once per year</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              Current pricing for each plan is displayed on the Service&apos;s pricing or checkout page. We reserve the right to change subscription pricing at any time, provided we give you at least 30 days&apos; advance notice before any price change takes effect on your account.
            </p>

            <h3 className="font-semibold text-ink">4.2 Free Tier</h3>
            <p className="text-ink-muted leading-relaxed">
              Certain features of the Service are available without a paid subscription. We reserve the right to modify, limit, or discontinue free tier features at any time without notice.
            </p>

            <h3 className="font-semibold text-ink">4.3 Automatic Renewal — Important Notice</h3>
            <p className="text-ink-muted leading-relaxed uppercase font-semibold">
              Your subscription will automatically renew at the end of each subscription period at the then-current rate unless you cancel before the renewal date.
            </p>
            <p className="text-ink-muted leading-relaxed">
              By subscribing, you authorize Charbella Games to charge your payment method on a recurring basis until you cancel. For Monthly Plan subscribers, your subscription renews monthly on the same date each month. For Annual Plan subscribers, your subscription renews annually on the same date each year. We will send a reminder email before your Annual Plan renewal date. You are responsible for canceling before the renewal date if you do not wish to be charged for the next period.
            </p>

            <h3 className="font-semibold text-ink">4.4 Payment Processing</h3>
            <p className="text-ink-muted leading-relaxed">
              All payments are processed by Stripe, Inc. By subscribing, you agree to Stripe&apos;s Terms of Service and authorize Stripe to charge your designated payment method. Charbella Games does not store your full payment card details. If a payment fails, we will attempt to retry the charge. If payment cannot be collected after repeated attempts, your subscription may be suspended or downgraded to the free tier until payment is resolved.
            </p>

            <h3 className="font-semibold text-ink">4.5 Cancellation</h3>
            <p className="text-ink-muted leading-relaxed">
              You may cancel your subscription at any time through your account settings or by contacting us at{" "}
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>.
              Cancellation takes effect at the end of your current billing period. You will retain access to premium features until the end of the period for which you have already paid.
            </p>
            <p className="text-ink-muted leading-relaxed">
              To cancel, log in to your account, navigate to Account Settings, and select &ldquo;Manage Subscription.&rdquo; You may also cancel through the Stripe billing portal accessible from your account settings.
            </p>

            <h3 className="font-semibold text-ink">4.6 No Refunds</h3>
            <p className="text-ink-muted leading-relaxed uppercase font-semibold">
              All subscription fees are non-refundable except where required by applicable law.
            </p>
            <p className="text-ink-muted leading-relaxed">
              We do not provide refunds or credits for partially used subscription periods, unused premium features, or cancellations made mid-period. If you believe a charge was made in error, please contact us at{" "}
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>{" "}
              within 30 days of the charge and we will review your request.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">5. Intellectual Property</h2>

            <h3 className="font-semibold text-ink">5.1 Our Content</h3>
            <p className="text-ink-muted leading-relaxed">
              The Service and all of its content, features, and functionality — including but not limited to puzzles, text, graphics, logos, icons, images, audio, software, and the selection and arrangement thereof — are owned by Charbella Games LLC or its licensors and are protected by United States and international copyright, trademark, and other intellectual property laws. &ldquo;Circa Game&rdquo; and &ldquo;Charbella Games&rdquo; are trade names of Charbella Games LLC. You may not use these names, logos, or branding in any manner without our prior written consent.
            </p>

            <h3 className="font-semibold text-ink">5.2 Puzzle Content</h3>
            <p className="text-ink-muted leading-relaxed">
              All daily puzzles, puzzle formats, scoring systems, and related content are original works of Charbella Games LLC. You may not reproduce, distribute, publish, or create derivative works based on our puzzle content without our express written permission.
            </p>

            <h3 className="font-semibold text-ink">5.3 User-Generated Content — Shared Results</h3>
            <p className="text-ink-muted leading-relaxed">
              The Service allows you to share your puzzle results (such as score summaries or completion graphics) on third-party platforms (&ldquo;Shared Results&rdquo;). By sharing results generated by the Service, you agree that:
            </p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Shared Results may include visual elements owned by Charbella Games LLC, which you are permitted to share solely for personal, non-commercial purposes</li>
              <li>You will not modify Shared Results in a way that misrepresents your score, the game, or Charbella Games LLC</li>
              <li>You will not use Shared Results for any commercial purpose without our prior written consent</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              We retain all intellectual property rights in the format and design of Shared Results.
            </p>

            <h3 className="font-semibold text-ink">5.4 Leaderboard Data</h3>
            <p className="text-ink-muted leading-relaxed">
              Leaderboard scores and rankings are generated by the Service and owned by Charbella Games LLC. You grant us a perpetual, royalty-free license to display your username and scores on public or private leaderboards within the Service.
            </p>

            <h3 className="font-semibold text-ink">5.5 Feedback</h3>
            <p className="text-ink-muted leading-relaxed">
              If you submit feedback, suggestions, or ideas about the Service, you grant Charbella Games LLC a non-exclusive, perpetual, irrevocable, royalty-free license to use, reproduce, and incorporate that feedback into the Service without any obligation to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">6. Prohibited Conduct</h2>
            <p className="text-ink-muted leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
              <li>Attempt to gain unauthorized access to any part of the Service or another user&apos;s account</li>
              <li>Use any automated means (bots, scripts, scrapers) to access, collect data from, or interact with the Service</li>
              <li>Manipulate, falsify, or misrepresent your puzzle scores or leaderboard rankings</li>
              <li>Interfere with or disrupt the integrity or performance of the Service or its servers</li>
              <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity</li>
              <li>Upload or transmit any malicious code, viruses, or harmful data</li>
              <li>Use the Service to infringe the intellectual property rights of Charbella Games or any third party</li>
              <li>Resell, sublicense, or provide access to the Service to third parties for commercial gain</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              We reserve the right to suspend or terminate your account without notice if we determine, in our sole discretion, that you have violated these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">7. Leaderboards and Shared Features</h2>
            <p className="text-ink-muted leading-relaxed">
              The Service includes leaderboards that display usernames and scores, and allows sharing of puzzle results on third-party platforms. By participating in these features, you acknowledge that:
            </p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Your username and scores may be visible to other users of the Service</li>
              <li>We are not responsible for how Shared Results are received, interpreted, or used once posted on third-party platforms</li>
              <li>We reserve the right to remove any username from the leaderboard that we determine, in our sole discretion, to be inappropriate, offensive, or in violation of these Terms</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              Leaderboards are provided for entertainment purposes only. We do not guarantee the accuracy, completeness, or availability of leaderboard data at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">8. Copyright — DMCA Policy</h2>
            <p className="text-ink-muted leading-relaxed">
              Charbella Games LLC respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe that content on the Service infringes your copyright, please send a written notice to our designated DMCA agent containing:
            </p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>A description of the copyrighted work you claim has been infringed</li>
              <li>A description of where the allegedly infringing material is located on the Service</li>
              <li>Your contact information (name, address, telephone number, and email address)</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law</li>
              <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner&apos;s behalf</li>
              <li>Your physical or electronic signature</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              DMCA notices should be sent to our designated agent at{" "}
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>.
              For full DMCA policy details, see our{" "}
              <a href="/dmca" className="underline hover:text-gold transition-colors">DMCA / Copyright page</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">9. Disclaimers</h2>
            <p className="text-ink-muted leading-relaxed uppercase font-semibold">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
            <p className="text-ink-muted leading-relaxed">
              Charbella Games LLC does not warrant that: (a) the Service will be uninterrupted, error-free, or secure; (b) any defects will be corrected; (c) the Service or the servers that make it available are free of viruses or other harmful components; or (d) the results of using the Service will meet your expectations.
            </p>
            <p className="text-ink-muted leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice. We will not be liable to you or any third party for any such modification, suspension, or discontinuation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">10. Limitation of Liability</h2>
            <p className="text-ink-muted leading-relaxed uppercase font-semibold">
              To the fullest extent permitted by applicable law, in no event shall Charbella Games LLC, its members, managers, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, arising out of or relating to your use of or inability to use the Service.
            </p>
            <p className="text-ink-muted leading-relaxed">
              In no event shall Charbella Games LLC&apos;s total cumulative liability to you for all claims arising out of or relating to these Terms or the Service exceed the greater of: (a) the total amount you paid to Charbella Games in the 12 months immediately preceding the claim, or (b) fifty dollars ($50.00).
            </p>
            <p className="text-ink-muted leading-relaxed">
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so the above limitations may not apply to you in full.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">11. Indemnification</h2>
            <p className="text-ink-muted leading-relaxed">
              You agree to indemnify, defend, and hold harmless Charbella Games LLC and its members, managers, employees, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or relating to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party right, including intellectual property rights; or (d) any content you share or transmit through the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">12. Dispute Resolution</h2>

            <h3 className="font-semibold text-ink">12.1 Informal Resolution</h3>
            <p className="text-ink-muted leading-relaxed">
              Before initiating any formal legal proceeding, you agree to contact us at{" "}
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>{" "}
              and give us 30 days to attempt to resolve the dispute informally. Most concerns can be resolved quickly this way.
            </p>

            <h3 className="font-semibold text-ink">12.2 Governing Law</h3>
            <p className="text-ink-muted leading-relaxed">
              These Terms and any dispute arising out of or relating to these Terms or the Service shall be governed by and construed in accordance with the laws of the State of Illinois, without regard to its conflict of law provisions.
            </p>

            <h3 className="font-semibold text-ink">12.3 Jurisdiction</h3>
            <p className="text-ink-muted leading-relaxed">
              Any dispute arising out of or relating to these Terms or the Service that cannot be resolved informally shall be submitted to the exclusive jurisdiction of the state or federal courts located in Cook County, Illinois. You consent to personal jurisdiction and venue in such courts and waive any objection to jurisdiction or venue therein.
            </p>

            <h3 className="font-semibold text-ink">12.4 Time Limitation on Claims</h3>
            <p className="text-ink-muted leading-relaxed">
              Any claim arising out of or relating to these Terms or the Service must be brought within one (1) year after the cause of action arises, or it will be permanently barred.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">13. Termination</h2>
            <p className="text-ink-muted leading-relaxed">
              We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice, including for violation of these Terms. Upon termination:
            </p>
            <ul className="list-disc list-inside text-ink-muted space-y-1 leading-relaxed">
              <li>Your license to use the Service immediately terminates</li>
              <li>You will lose access to any premium features</li>
              <li>We have no obligation to retain your account data beyond our standard data retention period</li>
              <li>Provisions of these Terms that by their nature should survive termination will survive, including intellectual property provisions, disclaimers, limitations of liability, and dispute resolution</li>
            </ul>
            <p className="text-ink-muted leading-relaxed">
              You may terminate your account at any time by contacting us at{" "}
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>.
              Termination of your account does not entitle you to a refund of any prepaid subscription fees.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">14. General Provisions</h2>

            <h3 className="font-semibold text-ink">14.1 Entire Agreement</h3>
            <p className="text-ink-muted leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Charbella Games LLC with respect to the Service and supersede all prior agreements and understandings.
            </p>

            <h3 className="font-semibold text-ink">14.2 Severability</h3>
            <p className="text-ink-muted leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, that provision will be enforced to the maximum extent permissible, and the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="font-semibold text-ink">14.3 Waiver</h3>
            <p className="text-ink-muted leading-relaxed">
              Our failure to enforce any right or provision of these Terms will not be deemed a waiver of that right or provision.
            </p>

            <h3 className="font-semibold text-ink">14.4 Assignment</h3>
            <p className="text-ink-muted leading-relaxed">
              You may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations under these Terms without restriction.
            </p>

            <h3 className="font-semibold text-ink">14.5 No Third-Party Beneficiaries</h3>
            <p className="text-ink-muted leading-relaxed">
              These Terms do not create any third-party beneficiary rights.
            </p>

            <h3 className="font-semibold text-ink">14.6 Force Majeure</h3>
            <p className="text-ink-muted leading-relaxed">
              We will not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including natural disasters, acts of government, labor disputes, internet outages, or third-party service failures.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-ink">15. Contact Information</h2>
            <p className="text-ink-muted leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <address className="not-italic text-ink-muted leading-relaxed">
              Charbella Games LLC<br />
              Attn: Legal<br />
              1224 W Webster Ave Apt 3F<br />
              Chicago, IL 60614<br />
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">support@circagame.com</a>
            </address>
          </section>

        </div>
      </div>
    </main>
  );
}
