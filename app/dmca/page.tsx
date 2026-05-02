import NavHeader from "@/components/NavHeader";

export const metadata = { title: "DMCA / Copyright · Circa" };

export default function DmcaPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <NavHeader backHref="/" />

        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-teal">dmca / copyright</h1>
          <p className="font-sans text-xs text-ink-muted">Last updated: May 2, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none font-sans text-ink space-y-6">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">Copyright Policy</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Charbella Games LLC respects the intellectual property rights of others and expects users of Circa to do the same. We respond to notices of alleged copyright infringement that comply with the Digital Millennium Copyright Act (DMCA).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">Filing a DMCA Notice</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              If you believe content on Circa infringes your copyright, please send a written notice to our designated agent containing all of the following:
            </p>
            <ul className="text-sm text-ink-muted leading-relaxed space-y-1 list-disc list-inside">
              <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
              <li>Identification of the copyrighted work claimed to have been infringed.</li>
              <li>Identification of the material claimed to be infringing, with enough detail for us to locate it.</li>
              <li>Your contact information (name, address, phone number, email).</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner.</li>
              <li>A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on their behalf.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">Designated Agent</h2>
            <p className="text-sm text-ink-muted leading-relaxed">Send DMCA notices to our designated agent:</p>
            <address className="not-italic text-sm text-ink-muted leading-relaxed">
              Andrew Feightner<br />
              Charbella Games LLC<br />
              Attn: DMCA Agent<br />
              1224 W Webster Ave Apt 3F<br />
              Chicago, IL 60614<br />
              <a href="mailto:support@circagame.com" className="underline hover:text-gold transition-colors">
                support@circagame.com
              </a>
            </address>
            <p className="text-sm text-ink-muted leading-relaxed">
              Charbella Games LLC has registered a designated DMCA agent with the United States Copyright Office.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">Counter-Notice</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              If you believe material was removed as a result of a mistake or misidentification, you may submit a counter-notice to the address above. Counter-notices must meet the requirements of 17 U.S.C. § 512(g)(3).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-ink">Repeat Infringers</h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              Charbella Games LLC will, in appropriate circumstances, terminate the accounts of users who are repeat infringers of intellectual property rights.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
