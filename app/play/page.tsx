"use client";

import { useEffect, useReducer, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { YEAR_MIN, YEAR_MAX } from "@/lib/scoring";
import YearSlider from "@/components/YearSlider";
import EventCard from "@/components/EventCard";
import ProgressBar from "@/components/ProgressBar";
import RevealCard from "@/components/RevealCard";
import NavHeader from "@/components/NavHeader";
import { formatPuzzleDate } from "@/lib/dates";
import type { DailyPuzzle, Guess, GuessResult, SessionResult } from "@/types";

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

type Phase = "loading" | "guessing" | "revealing" | "submitting" | "error";

interface State {
  phase: Phase;
  puzzle: DailyPuzzle | null;
  currentIndex: number;
  sliderYear: number;
  guesses: Guess[];
  currentResult: GuessResult | null;
  error: string | null;
}

type Action =
  | { type: "PUZZLE_LOADED"; puzzle: DailyPuzzle }
  | { type: "SLIDER_CHANGED"; year: number }
  | { type: "GUESS_REVEALED"; result: GuessResult; guess: Guess }
  | { type: "NEXT_EVENT" }
  | { type: "SUBMITTING" }
  | { type: "ERROR"; message: string };

const MID_YEAR = Math.round((YEAR_MIN + YEAR_MAX) / 2); // 1512

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PUZZLE_LOADED":
      return { ...state, phase: "guessing", puzzle: action.puzzle, sliderYear: MID_YEAR };

    case "SLIDER_CHANGED":
      return state.phase === "guessing" ? { ...state, sliderYear: action.year } : state;

    case "GUESS_REVEALED":
      return {
        ...state,
        phase: "revealing",
        guesses: [...state.guesses, action.guess],
        currentResult: action.result,
      };

    case "NEXT_EVENT":
      return {
        ...state,
        phase: "guessing",
        currentIndex: state.currentIndex + 1,
        sliderYear: MID_YEAR,
        currentResult: null,
      };

    case "SUBMITTING":
      return { ...state, phase: "submitting" };

    case "ERROR":
      return { ...state, phase: "error", error: action.message };

    default:
      return state;
  }
}

const initialState: State = {
  phase: "loading",
  puzzle: null,
  currentIndex: 0,
  sliderYear: MID_YEAR,
  guesses: [],
  currentResult: null,
  error: null,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlayPage() {
  return (
    <Suspense fallback={<PageShell><LoadingSpinner message="Loading puzzle…" /></PageShell>}>
      <PlayPageInner />
    </Suspense>
  );
}

function PlayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?date=YYYY-MM-DD is set by the archive page for past puzzles
  const archiveDate = searchParams.get("date") ?? undefined;

  const [state, dispatch] = useReducer(reducer, initialState);

  // ---------------------------------------------------------------------------
  // Auth helper — always pulls the latest token from the browser session and
  // passes it as a Bearer header so server routes don't depend on cookies.
  // ---------------------------------------------------------------------------
  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers ?? {}),
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
    });
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // Ensure we have a session before making authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          const detail = error.message ? ` (${error.message})` : "";
          dispatch({ type: "ERROR", message: `Failed to start session${detail}. If this persists, anonymous sign-in may not be enabled in Supabase.` });
          return;
        }
      }

      // For today's puzzle, redirect if already played
      if (!archiveDate) {
        const existingRes = await authFetch("/api/results");
        if (existingRes.ok) {
          router.replace("/results");
          return;
        }
      }

      const dailyUrl = archiveDate ? `/api/daily?date=${archiveDate}` : "/api/daily";
      const puzzleRes = await authFetch(dailyUrl);
      if (!puzzleRes.ok) {
        if (puzzleRes.status === 403) {
          dispatch({ type: "ERROR", message: "This puzzle requires Circa+. Upgrade to access the full archive." });
          return;
        }
        dispatch({ type: "ERROR", message: "No puzzle available. Check back tomorrow!" });
        return;
      }
      const puzzle: DailyPuzzle = await puzzleRes.json();
      dispatch({ type: "PUZZLE_LOADED", puzzle });
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock in guess → call /api/guess → show reveal
  async function handleLockGuess() {
    if (!state.puzzle) return;
    const event = state.puzzle.events[state.currentIndex];
    const guess: Guess = { eventId: event.id, guessYear: state.sliderYear };

    const res = await authFetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...guess,
        ...(archiveDate ? { puzzleDate: archiveDate } : {}),
      }),
    });

    if (!res.ok) {
      let message = "Something went wrong. Please try again.";
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch { /* ignore parse errors */ }
      dispatch({ type: "ERROR", message });
      return;
    }

    const result: GuessResult = await res.json();
    dispatch({ type: "GUESS_REVEALED", result, guess });
  }

  async function handleNext() {
    if (!state.puzzle) return;
    const isLast = state.currentIndex === state.puzzle.events.length - 1;

    if (isLast) {
      dispatch({ type: "SUBMITTING" });

      const res = await authFetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guesses: state.guesses,
          ...(archiveDate ? { puzzleDate: archiveDate } : {}),
        }),
      });

      if (!res.ok) {
        dispatch({ type: "ERROR", message: "Failed to save results. Please try again." });
        return;
      }

      const result: SessionResult = await res.json();
      sessionStorage.setItem("circa_result", JSON.stringify(result));
      router.push("/results");
    } else {
      dispatch({ type: "NEXT_EVENT" });
    }
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (state.phase === "loading") {
    return <PageShell archiveDate={archiveDate}><LoadingSpinner message="Loading puzzle…" /></PageShell>;
  }

  if (state.phase === "submitting") {
    return <PageShell archiveDate={archiveDate}><LoadingSpinner message="Saving your results…" /></PageShell>;
  }

  if (state.phase === "error") {
    return (
      <PageShell archiveDate={archiveDate}>
        <div className="text-center space-y-4 py-12">
          <p className="font-serif text-xl text-ink">{state.error}</p>
          <div className="space-y-2">
            {state.error?.includes("Circa+") && (
              <a href="/plus" className="block font-sans text-sm text-gold underline">
                Upgrade to Plus →
              </a>
            )}
            <a href={archiveDate ? "/archive" : "/"} className="block font-sans text-sm text-ink-muted underline">
              {archiveDate ? "Back to archive" : "Back to home"}
            </a>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!state.puzzle) return null;

  const currentEvent = state.puzzle.events[state.currentIndex];
  const isLast = state.currentIndex === state.puzzle.events.length - 1;
  const isRevealing = state.phase === "revealing";

  return (
    <PageShell archiveDate={archiveDate}>
      <ProgressBar current={state.currentIndex + 1} total={state.puzzle.events.length} />

      {/* Event card — always visible */}
      <EventCard
        description={currentEvent.description}
        eventNumber={state.currentIndex + 1}
        imageUrl={currentEvent.imageUrl}
      />

      {/* Guessing phase */}
      {!isRevealing && (
        <>
          <YearSlider
            value={state.sliderYear}
            onChange={(y) => dispatch({ type: "SLIDER_CHANGED", year: y })}
          />
          <button
            onClick={handleLockGuess}
            className="w-full rounded-2xl bg-ink py-4 font-sans font-semibold text-parchment transition-colors hover:bg-ink/80 active:scale-95"
          >
            Lock In {state.sliderYear}
          </button>
        </>
      )}

      {/* Reveal phase */}
      {isRevealing && state.currentResult && (
        <>
          <RevealCard
            result={state.currentResult}
            eventNumber={state.currentIndex + 1}
            description={currentEvent.description}
          />
          <button
            onClick={handleNext}
            className="w-full rounded-2xl bg-gold py-4 font-sans font-semibold text-white transition-colors hover:bg-gold/80 active:scale-95"
          >
            {isLast ? "See Final Results →" : "Next Event →"}
          </button>
        </>
      )}
    </PageShell>
  );
}

function PageShell({ children, archiveDate }: { children: React.ReactNode; archiveDate?: string | undefined }) {
  const label = archiveDate ? formatPuzzleDate(archiveDate) : undefined;
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <NavHeader backHref={archiveDate ? "/archive" : "/"} />
        {label && (
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted text-center">
            archive · {label}
          </p>
        )}
        {children}
      </div>
    </main>
  );
}

function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 font-sans text-ink-muted">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/20 border-t-gold" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
