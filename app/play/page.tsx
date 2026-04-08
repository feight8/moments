"use client";

import { useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { YEAR_MIN, YEAR_MAX } from "@/lib/scoring";
import YearSlider from "@/components/YearSlider";
import EventCard from "@/components/EventCard";
import ProgressBar from "@/components/ProgressBar";
import type { DailyPuzzle, Guess, SessionResult } from "@/types";

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

type Phase = "loading" | "guessing" | "locked" | "submitting" | "error";

interface State {
  phase: Phase;
  puzzle: DailyPuzzle | null;
  currentIndex: number;
  sliderYear: number;
  lockedYear: number | null;
  guesses: Guess[];
  error: string | null;
}

type Action =
  | { type: "PUZZLE_LOADED"; puzzle: DailyPuzzle }
  | { type: "SLIDER_CHANGED"; year: number }
  | { type: "LOCK_GUESS" }
  | { type: "NEXT_EVENT" }
  | { type: "SUBMITTING" }
  | { type: "ERROR"; message: string };

const MID_YEAR = Math.round((YEAR_MIN + YEAR_MAX) / 2); // 1013

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PUZZLE_LOADED":
      return { ...state, phase: "guessing", puzzle: action.puzzle, sliderYear: MID_YEAR };

    case "SLIDER_CHANGED":
      return state.phase === "guessing" ? { ...state, sliderYear: action.year } : state;

    case "LOCK_GUESS": {
      const event = state.puzzle!.events[state.currentIndex];
      return {
        ...state,
        phase: "locked",
        lockedYear: state.sliderYear,
        guesses: [...state.guesses, { eventId: event.id, guessYear: state.sliderYear }],
      };
    }

    case "NEXT_EVENT":
      return {
        ...state,
        phase: "guessing",
        currentIndex: state.currentIndex + 1,
        sliderYear: MID_YEAR,
        lockedYear: null,
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
  lockedYear: null,
  guesses: [],
  error: null,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlayPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // Ensure we have a session (anonymous sign-in if needed)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
      }

      // Redirect if already played today
      const existingRes = await fetch("/api/results");
      if (existingRes.ok) {
        router.replace("/results");
        return;
      }

      // Load today's puzzle
      const puzzleRes = await fetch("/api/daily");
      if (!puzzleRes.ok) {
        dispatch({ type: "ERROR", message: "No puzzle available today. Check back tomorrow!" });
        return;
      }
      const puzzle: DailyPuzzle = await puzzleRes.json();
      dispatch({ type: "PUZZLE_LOADED", puzzle });
    }

    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFinalSubmit() {
    dispatch({ type: "SUBMITTING" });

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guesses: state.guesses }),
    });

    if (!res.ok) {
      dispatch({ type: "ERROR", message: "Failed to submit. Please try again." });
      return;
    }

    const result: SessionResult = await res.json();
    sessionStorage.setItem("moments_result", JSON.stringify(result));
    router.push("/results");
  }

  async function handleNext() {
    const isLast = state.puzzle && state.currentIndex === state.puzzle.events.length - 1;
    if (isLast) {
      await handleFinalSubmit();
    } else {
      dispatch({ type: "NEXT_EVENT" });
    }
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (state.phase === "loading") {
    return (
      <PageShell>
        <LoadingSpinner message="Loading today's puzzle…" />
      </PageShell>
    );
  }

  if (state.phase === "submitting") {
    return (
      <PageShell>
        <LoadingSpinner message="Scoring your results…" />
      </PageShell>
    );
  }

  if (state.phase === "error") {
    return (
      <PageShell>
        <div className="text-center space-y-4 py-12">
          <p className="font-serif text-xl text-ink">{state.error}</p>
          <a href="/" className="inline-block font-sans text-sm text-ink-muted underline">
            Back to home
          </a>
        </div>
      </PageShell>
    );
  }

  if (!state.puzzle) return null;

  const currentEvent = state.puzzle.events[state.currentIndex];
  const isLast = state.currentIndex === state.puzzle.events.length - 1;
  const isLocked = state.phase === "locked";

  return (
    <PageShell>
      <ProgressBar current={state.currentIndex + 1} total={state.puzzle.events.length} />

      <EventCard description={currentEvent.description} eventNumber={state.currentIndex + 1} />

      <YearSlider
        value={state.sliderYear}
        onChange={(y) => dispatch({ type: "SLIDER_CHANGED", year: y })}
        disabled={isLocked}
      />

      {/* Locked-in confirmation */}
      {isLocked && state.lockedYear !== null && (
        <div className="rounded-2xl border border-ink/10 bg-white/60 px-5 py-4 text-center backdrop-blur-sm">
          <p className="font-sans text-sm text-ink-muted">Locked in</p>
          <p className="font-serif text-3xl font-bold text-ink">{state.lockedYear}</p>
          <p className="mt-1 font-sans text-xs text-ink-muted">
            Correct year revealed after all 5 events
          </p>
        </div>
      )}

      {/* Action button */}
      {!isLocked ? (
        <button
          onClick={() => dispatch({ type: "LOCK_GUESS" })}
          className="w-full rounded-2xl bg-ink py-4 font-sans font-semibold text-parchment transition-colors hover:bg-ink/80 active:scale-95"
        >
          Lock In {state.sliderYear}
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full rounded-2xl bg-gold py-4 font-sans font-semibold text-white transition-colors hover:bg-gold/80 active:scale-95"
        >
          {isLast ? "See Results →" : "Next Event →"}
        </button>
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        <header>
          <h1 className="font-serif text-2xl font-bold text-ink">Moments</h1>
        </header>
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
