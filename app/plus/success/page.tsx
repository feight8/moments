import Link from "next/link";
import NavHeader from "@/components/NavHeader";
import PlusBadge from "@/components/PlusBadge";

export default function PlusSuccessPage() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        <NavHeader />

        <div className="text-center space-y-6 py-12">
          <div className="text-6xl">💎</div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <PlusBadge size="md" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink">welcome to plus</h1>
            <p className="font-sans text-sm text-ink-muted leading-relaxed max-w-xs mx-auto">
              Your subscription is active. The full archive, stats, and streak shields are now unlocked.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/archive"
              className="block w-full rounded-2xl bg-gold py-4 font-sans font-semibold text-white transition-colors hover:bg-gold/80 text-center"
            >
              Browse the Archive →
            </Link>
            <Link
              href="/"
              className="block w-full rounded-2xl border border-ink/10 bg-white/60 py-4 font-sans font-semibold text-ink transition-colors hover:bg-ink/5 text-center"
            >
              Play Today&apos;s Puzzle
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
