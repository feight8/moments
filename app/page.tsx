import Link from "next/link";
import { formatPuzzleDate, todayDate } from "@/lib/dates";
import NavHeader from "@/components/NavHeader";
import CircaLogo from "@/components/CircaLogo";
import PlusBadge from "@/components/PlusBadge";

export default function HomePage() {
  const dateLabel = formatPuzzleDate(todayDate());

  return (
    <main className="min-h-screen bg-parchment flex flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md w-full space-y-8">
        <NavHeader />

        {/* Logo / title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <CircaLogo className="h-14 w-auto text-ink" />
          </div>
          <p className="font-sans text-ink-muted">{dateLabel}</p>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-6 backdrop-blur-sm text-left space-y-3">
          <p className="font-serif text-lg text-ink leading-relaxed">
            five moments in history. when did they happen?
          </p>
          <ul className="font-sans text-sm text-ink-muted space-y-1.5">
            <li>- read the description</li>
            <li>- drag to your best guess</li>
            <li>- score up to 100 points per event</li>
            <li>- build your streak</li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/play"
          className="inline-block w-full rounded-2xl bg-ink py-4 font-sans font-semibold text-parchment transition-colors hover:bg-ink/80 active:scale-95 text-center"
        >
          play today&apos;s puzzle
        </Link>

        {/* Plus teaser */}
        <Link
          href="/plus"
          className="flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4 hover:bg-gold/10 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💎</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-semibold text-ink">circa plus</span>
                <PlusBadge />
              </div>
              <p className="font-sans text-xs text-ink-muted mt-0.5">
                Archive · streak shields · stats - from $2.99/mo
              </p>
            </div>
          </div>
          <span className="text-ink-muted group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>

        <p className="text-center font-sans text-xs text-ink-muted">
          new puzzle every day
        </p>
      </div>
    </main>
  );
}
