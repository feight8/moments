import Link from "next/link";
import { formatPuzzleDate, todayUTC } from "@/lib/dates";
import NavHeader from "@/components/NavHeader";

export default function HomePage() {
  const dateLabel = formatPuzzleDate(todayUTC());

  return (
    <main className="min-h-screen bg-parchment flex flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md w-full space-y-8">
        <NavHeader />

        {/* Logo / title */}
        <div className="text-center space-y-2">
          <h1 className="font-serif text-6xl font-bold text-ink">moments</h1>
          <p className="font-sans text-ink-muted">{dateLabel}</p>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-6 backdrop-blur-sm text-left space-y-3">
          <p className="font-serif text-lg text-ink leading-relaxed">
            five moments in time. when did they happen?
          </p>
          <ul className="font-sans text-sm text-ink-muted space-y-1.5">
            <li>- read the description</li>
            <li>- drag to your best guess</li>
            <li>- score up to 110 points per event</li>
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

        <p className="text-center font-sans text-xs text-ink-muted">
          new puzzle every day
        </p>
      </div>
    </main>
  );
}
