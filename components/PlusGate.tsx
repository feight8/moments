import Link from "next/link";
import PlusBadge from "@/components/PlusBadge";

interface PlusGateProps {
  children?: React.ReactNode;
  /** Pass false to always render children (user has Plus). */
  locked: boolean;
  feature?: string;
}

/**
 * Renders children when the user has Plus; otherwise shows an upgrade prompt.
 * The `locked` prop should be determined server-side.
 */
export default function PlusGate({ children, locked, feature }: PlusGateProps) {
  if (!locked) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center space-y-4">
      <div className="flex justify-center">
        <PlusBadge size="md" />
      </div>
      <div className="space-y-1.5">
        <p className="font-serif text-xl font-bold text-ink">
          {feature ?? "This feature"} is Plus-exclusive
        </p>
        <p className="font-sans text-sm text-ink-muted leading-relaxed">
          Unlock the full archive, streak shields, stats, and more with Circa+ for $2.99/month or $14.99/year.
        </p>
      </div>
      <Link
        href="/plus"
        className="inline-block rounded-2xl bg-gold px-6 py-3 font-sans font-semibold text-white transition-colors hover:bg-gold/80"
      >
        Upgrade to Plus
      </Link>
    </div>
  );
}
