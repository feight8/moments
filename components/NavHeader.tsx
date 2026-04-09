import Link from "next/link";

interface NavHeaderProps {
  /** Show a back arrow instead of logo link (e.g. on help page). */
  backHref?: string;
}

export default function NavHeader({ backHref }: NavHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      {backHref ? (
        <Link
          href={backHref}
          className="flex items-center gap-1.5 font-sans text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          back
        </Link>
      ) : (
        <Link href="/" className="font-serif text-2xl font-bold text-ink hover:opacity-80 transition-opacity">
          moments
        </Link>
      )}

      <Link
        href="/help"
        aria-label="Help and settings"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink-muted hover:text-ink hover:border-ink/30 transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
          <path
            d="M7.5 1C3.91 1 1 3.91 1 7.5S3.91 14 7.5 14 14 11.09 14 7.5 11.09 1 7.5 1zM7.5 11a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3.25a.75.75 0 01-1.5 0V7.5c0-.83.51-1.58 1.28-1.89A1.25 1.25 0 107.5 4a.75.75 0 01-1.5 0 2.75 2.75 0 11.75 5.32V7.75z"
            fill="currentColor"
          />
        </svg>
      </Link>
    </header>
  );
}
