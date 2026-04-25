import Link from "next/link";
import CircaLogo from "@/components/CircaLogo";

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
        <Link href="/" className="text-ink hover:opacity-80 transition-opacity">
          <CircaLogo className="h-7 w-auto" />
        </Link>
      )}

      <nav className="flex items-center gap-1">
        {/* Account */}
        <Link
          href="/account"
          aria-label="Account"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink-muted hover:text-ink hover:border-ink/30 transition-colors"
          title="Account"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M7.5 1a3 3 0 100 6 3 3 0 000-6zM2 13c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5H2z" fill="currentColor"/>
          </svg>
        </Link>

        {/* Archive */}
        <Link
          href="/archive"
          aria-label="Puzzle archive"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink-muted hover:text-ink hover:border-ink/30 transition-colors"
          title="Archive"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M2 3.5A1.5 1.5 0 013.5 2h8A1.5 1.5 0 0113 3.5v1A1.5 1.5 0 0111.5 6H3.5A1.5 1.5 0 012 4.5v-1z" fill="currentColor" opacity=".4"/>
            <path d="M2.5 6.5h10v5A1.5 1.5 0 0111 13H4a1.5 1.5 0 01-1.5-1.5v-5zm3 2a.5.5 0 000 1h4a.5.5 0 000-1h-4z" fill="currentColor"/>
          </svg>
        </Link>

        {/* Stats */}
        <Link
          href="/stats"
          aria-label="Personal stats"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink-muted hover:text-ink hover:border-ink/30 transition-colors"
          title="Stats"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M3 11.5v-3a.5.5 0 011 0v3a.5.5 0 01-1 0zm3-5.5v5.5a.5.5 0 001 0V6a.5.5 0 00-1 0zm3 2.5V11.5a.5.5 0 001 0V8.5a.5.5 0 00-1 0zm3-4v7a.5.5 0 001 0v-7a.5.5 0 00-1 0z" fill="currentColor"/>
          </svg>
        </Link>

        {/* Groups */}
        <Link
          href="/groups"
          aria-label="Groups"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink-muted hover:text-ink hover:border-ink/30 transition-colors"
          title="Groups"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path d="M5.5 4a2 2 0 100 4 2 2 0 000-4zM2 10.5C2 9.12 3.12 8 4.5 8h2a2.5 2.5 0 012.45 2H2zm7.5-6a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm0 4c.46 0 .9.1 1.29.28A2.49 2.49 0 0113 11H9.12A2.5 2.5 0 009.5 8.5z" fill="currentColor"/>
          </svg>
        </Link>

        {/* Help */}
        <Link
          href="/help"
          aria-label="Help and settings"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 bg-white/60 text-ink-muted hover:text-ink hover:border-ink/30 transition-colors"
          title="Help & settings"
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
            <path
              d="M7.5 1C3.91 1 1 3.91 1 7.5S3.91 14 7.5 14 14 11.09 14 7.5 11.09 1 7.5 1zM7.5 11a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3.25a.75.75 0 01-1.5 0V7.5c0-.83.51-1.58 1.28-1.89A1.25 1.25 0 107.5 4a.75.75 0 01-1.5 0 2.75 2.75 0 11.75 5.32V7.75z"
              fill="currentColor"
            />
          </svg>
        </Link>
      </nav>
    </header>
  );
}
