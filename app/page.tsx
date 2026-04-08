import Link from "next/link";
import { formatPuzzleDate, todayUTC } from "@/lib/dates";

export default function HomePage() {
  const dateLabel = formatPuzzleDate(todayUTC());

  return (
    <main className="min-h-screen bg-parchment flex flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center space-y-8">
        {/* Logo / title */}
        <div className="space-y-2">
          <h1 className="font-serif text-6xl font-bold text-ink">Moments</h1>
          <p className="font-sans text-ink-muted">{dateLabel}</p>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-ink/10 bg-white/60 p-6 backdrop-blur-sm text-left space-y-3">
          <p className="font-serif text-lg text-ink leading-relaxed">
            Five historical events. No dates. Just your instincts and a slider.
          </p>
          <ul className="font-sans text-sm text-ink-muted space-y-1.5">
            <li>→ Read the description</li>
            <li>→ Drag to your best guess</li>
            <li>→ Score up to 110 points per event</li>
            <li>→ Build your streak</li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/play"
          className="inline-block w-full rounded-2xl bg-ink py-4 font-sans font-semibold text-parchment transition-colors hover:bg-ink/80 active:scale-95 text-center"
        >
          Play Today&apos;s Puzzle
        </Link>

        <p className="font-sans text-xs text-ink-muted">
          New puzzle every day. No account required.
        </p>
      </div>
    </main>
  );
}
