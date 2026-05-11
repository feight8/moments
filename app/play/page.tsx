import { Suspense } from "react";
import PlayClient from "./PlayClient";

export const dynamic = "force-dynamic";

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-3 py-16 font-sans text-ink-muted">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
          <p className="text-sm">Loading puzzle…</p>
        </div>
      </div>
    </main>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PlayClient />
    </Suspense>
  );
}
