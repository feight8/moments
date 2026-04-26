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
import { useSettings } from "@/lib/settings";
import { playLockIn, playReveal } from "@/lib/sounds";
import type { DailyPuzzle, Guess, GuessResult, SessionResult } from "@/types";

// ---------------------------------------------------------------------------
// Pending-submit persistence
// Guesses are saved to sessionStorage before every submit attempt so they
// survive page reloads, iOS Safari background-unloads, and accidental refreshes.
// ---------------------------------------------------------------------------

const PENDING_KEY = "circa_pending_submit";

interface PendingSubmit {
  puzzleDate: string;
  guesses: Guess[];
}

function savePending(puzzleDate: string, guesses: Guess[]) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ puzzleDate, guesses }));
  } catch { /* sessionStorage unavailable */ }
}

function clearPending() {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

function loadPending(): PendingSubmit | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingSubmit;
    return p.puzzleDate && Array.isArray(p.guesses) ? p : null;
  } catch { return null; }
}

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
  /** Inline error shown below the guess button — does NOT exit the guessing phase. */
  guessError: string | null;
  /** Full-screen error (submit failures, auth errors, no puzzle). */
  error: string | null;
}

type Action =
  | { type: "PUZZLE_LOADED"; puzzle: DailyPuzzle }
  | { type: "PUZZLE_RESTORED"; puzzle: DailyPuzzle; guesses: Guess[] }
  | { type: "SLIDER_CHANGED"; year: number }
  | { type: "GUESS_REVEALED"; result: GuessResult; guess: Guess }
  | { type: "GUESS_ERROR"; message: string }
  | { type: "NEXT_EVENT" }
  | { type: "SUBMITTING" }
  | { type: "ERROR"; message: string };

const MID_YEAR = Math.round((YEAR_MIN + YEAR_MAX) / 2);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PUZZLE_LOADED":
      return { ...state, phase: "guessing", puzzle: action.puzzle, sliderYear: MID_YEAR };

    // Restores a previously-started game that needs to be resubmitted.
    // Goes straight to "submitting" so the spinner shows while we retry.
    case "PUZZLE_RESTORED":
      return {
        ...state,
        phase: "submitting",
        puzzle: action.puzzle,
        guesses: action.guesses,
        currentIndex: action.puzzle.events.length - 1,
        sliderYear: MID_YEAR,
      };

    case "SLIDER_CHANGED":
      return state.phase === "guessing"
        ? { ...state, sliderYear: action.year, guessError: null }
        : state;

    case "GUESS_REVEALED":
      return {
        ...state,
        phase: "revealing",
        guesses: [...state.guesses, action.guess],
        currentResult: action.result,
        guessError: null,
      };

    // Inline guess error — stays in "guessing" phase so the user can retry.
    case "GUESS_ERROR":
      return { ...state, guessError: action.message };

    case "NEXT_EVENT":
      return {
        ...state,
        phase: "guessing",
        currentIndex: state.currentIndex + 1,
        sliderYear: MID_YEAR,
        currentResult: null,
        guessError: null,
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
  guessError: null,
  error: null,
};

// ---------------------------------------------------------------------------
// Page wrapper (Suspense required for useSearchParams)
// ---------------------------------------------------------------------------

export default function PlayPage() {
  return (
    <Suspense fallback={<PageShell><LoadingSpinner message="Loading puzzle..." /></PageShell>}>
      <PlayPageInner />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function PlayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const archiveDate = searchParams.get("date") ?? undefined;

  const [state, dispatch] = useReducer(reducer, initialState);
  const { settings } = useSettings();

  // ---------------------------------------------------------------------------
  // Auth helper — refreshes the session if needed before each request.
  // If the session is fully expired, re-authenticates anonymously as a
  // last resort so the user's UUID is preserved.
  // ---------------------------------------------------------------------------
  async function getAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    let { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // Try a silent refresh first
      const { data } = await supabase.auth.refreshSession();
      session = data.session;
    }

    if (!session) {
      // Last resort: re-sign-in anonymously (same UUID is preserved by Supabase)
      await supabase.auth.signInAnonymously();
      const { data: { session: s } } = await supabase.auth.getSession();
      session = s;
    }

    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  }

  async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const authHeaders = await getAuthHeaders();
    return fetch(url, {
      ...options,
      headers: { ...(options.headers as Record<string, string> ?? {}), ...authHeaders },
    });
  }

  // ---------------------------------------------------------------------------
  // Core submit logic — used by first attempt, retry button, and auto-recovery.
  // Saves guesses to sessionStorage before sending so they survive page reloads.
  // ---------------------------------------------------------------------------
  async function doSubmit(puzzleDate: string, guesses: Guess[]) {
    dispatch({ type: "SUBMITTING" });

    // Persist before sending — if the request fails or the page reloads,
    // the next init will detect these and auto-retry.
    savePending(puzzleDate, guesses);

    const authHeaders = await getAuthHeaders();

    let res: Response;
    try {
      res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ guesses, puzzleDate }),
      });
    } catch (err) {
      // Network drop, iOS connection loss, Vercel timeout, etc.
      console.error("[submit] fetch threw:", err);
      dispatch({
        type: "ERROR",
        message: "Connection lost. Your guesses are saved - tap to try again.",
      });
      return;
    }

    if (!res.ok) {
      let serverMsg = "";
      try { serverMsg = (await res.json())?.error ?? ""; } catch { /* ignore */ }
      console.error(`[submit] failed — HTTP ${res.status}:`, serverMsg || "(no body)");
      dispatch({
        type: "ERROR",
        message: serverMsg.includes("Circa+")
          ? serverMsg
          : "Something went wrong saving your results. Your guesses are saved - tap to try again.",
      });
      return;
    }

    // Success — clear the pending marker and go to results
    clearPending();
    const result: SessionResult = await res.json();
    sessionStorage.setItem("circa_result", JSON.stringify(result));
    router.push("/results");
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function init() {
      const supabase = createClient();

      // Ensure we have a session before making authenticated requests
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          dispatch({ type: "ERROR", message: `Failed to start session (${error.message}). Anonymous sign-in may not be enabled in Supabase.` });
          return;
        }
        ({ data: { session } } = await supabase.auth.getSession());
      }

      const authHeader: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      // For today's puzzle, redirect if already played
      if (!archiveDate) {
        const existingRes = await fetch("/api/results", { headers: authHeader });
        if (existingRes.ok) {
          router.replace("/results");
          return;
        }

        // Check for a pending submission from a previous failed attempt.
        // This fires when: the user refreshed, iOS unloaded the tab, etc.
        const pending = loadPending();
        if (pending?.guesses.length === 5) {
          const puzzleRes = await fetch("/api/daily", { headers: authHeader });
          if (puzzleRes.ok) {
            const puzzle: DailyPuzzle = await puzzleRes.json();
            if (puzzle.date === pending.puzzleDate) {
              // Same puzzle is still active — restore and auto-submit
              dispatch({ type: "PUZZLE_RESTORED", puzzle, guesses: pending.guesses });
              await doSubmit(pending.puzzleDate, pending.guesses);
              return;
            }
          }
          // Pending is stale (different day) — discard it
          clearPending();
        }
      } else {
        // Archive play — check for a pending submission for this specific date.
        // Handles the case where an archive submit failed and the user refreshed.
        const pending = loadPending();
        if (pending?.guesses.length === 5 && pending.puzzleDate === archiveDate) {
          const puzzleRes = await fetch(`/api/daily?date=${archiveDate}`, { headers: authHeader });
          if (puzzleRes.ok) {
            const puzzle: DailyPuzzle = await puzzleRes.json();
            dispatch({ type: "PUZZLE_RESTORED", puzzle, guesses: pending.guesses });
            await doSubmit(pending.puzzleDate, pending.guesses);
            return;
          }
          // Couldn't load the puzzle — clear and fall through to normal load
          clearPending();
        }
      }

      const dailyUrl = archiveDate ? `/api/daily?date=${archiveDate}` : "/api/daily";
      const puzzleRes = await fetch(dailyUrl, { headers: authHeader });
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

  // ---------------------------------------------------------------------------
  // Guess handler
  // ---------------------------------------------------------------------------
  async function handleLockGuess() {
    if (!state.puzzle) return;

    if (settings.soundEnabled) playLockIn();

    const event = state.puzzle.events[state.currentIndex];
    const guess: Guess = { eventId: event.id, guessYear: state.sliderYear };

    let res: Response;
    try {
      res = await authFetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...guess,
          ...(archiveDate ? { puzzleDate: archiveDate } : {}),
        }),
      });
    } catch {
      // Network drop — show inline error so the user can retry without losing progress
      dispatch({ type: "GUESS_ERROR", message: "Connection lost. Please try again." });
      return;
    }

    if (!res.ok) {
      let message = "Something went wrong. Please try again.";
      try { const body = await res.json(); if (body?.error) message = body.error; }
      catch { /* ignore */ }
      // Dispatch as inline error, not full-screen error — progress is preserved
      dispatch({ type: "GUESS_ERROR", message });
      return;
    }

    const result: GuessResult = await res.json();
    if (settings.soundEnabled) playReveal(result.score);
    dispatch({ type: "GUESS_REVEALED", result, guess });
  }

  // ---------------------------------------------------------------------------
  // Next / submit handler
  // ---------------------------------------------------------------------------
  async function handleNext() {
    if (!state.puzzle) return;
    const isLast = state.currentIndex === state.puzzle.events.length - 1;

    if (isLast) {
      // Guard against stale-closure race where GUESS_REVEALED hasn't settled yet
      if (state.guesses.length !== state.puzzle.events.length) return;
      const puzzleDate = archiveDate ?? state.puzzle.date;
      await doSubmit(puzzleDate, state.guesses);
    } else {
      dispatch({ type: "NEXT_EVENT" });
    }
  }

  // Dedicated retry — called only from the error screen.
  // Uses state directly rather than going through handleNext's isLast logic.
  async function handleRetrySubmit() {
    if (!state.puzzle || state.guesses.length !== 5) return;
    await doSubmit(archiveDate ?? state.puzzle.date, state.guesses);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (state.phase === "loading") {
    return <PageShell archiveDate={archiveDate}><LoadingSpinner message="Loading puzzle..." /></PageShell>;
  }

  if (state.phase === "submitting") {
    return <PageShell archiveDate={archiveDate}><LoadingSpinner message="Saving your results..." /></PageShell>;
  }

  if (state.phase === "error") {
    const canRetry = state.error?.includes("Your guesses are saved");
    return (
      <PageShell archiveDate={archiveDate}>
        <div className="text-center space-y-4 py-12">
          <p className="font-serif text-xl text-ink">{state.error}</p>
          <div className="space-y-2">
            {canRetry && (
              <button
                onClick={handleRetrySubmit}
                className="block w-full rounded-2xl bg-gold py-3 font-sans font-semibold text-teal hover:bg-gold/80 active:scale-95 transition-colors"
              >
                Try again
              </button>
            )}
            {state.error?.includes("Circa+") && (
              <a href="/plus" className="block font-sans text-sm text-gold underline">
                Upgrade to Plus
              </a>
            )}
            <a
              href={archiveDate ? "/archive" : "/"}
              className="block font-sans text-sm text-ink-muted underline"
            >
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

      <EventCard
        description={currentEvent.description}
        eventNumber={state.currentIndex + 1}
        imageUrl={currentEvent.imageUrl}
      />

      {!isRevealing && (
        <>
          <YearSlider
            value={state.sliderYear}
            onChange={(y) => dispatch({ type: "SLIDER_CHANGED", year: y })}
          />
          <button
            onClick={handleLockGuess}
            className="btn-primary w-full py-4 transition-colors active:scale-95"
          >
            lock in {state.sliderYear}
          </button>
          {state.guessError && (
            <p className="text-center font-sans text-sm text-red-600">{state.guessError}</p>
          )}
        </>
      )}

      {isRevealing && state.currentResult && (
        <>
          <RevealCard
            result={state.currentResult}
            eventNumber={state.currentIndex + 1}
            description={currentEvent.description}
          />
          <button
            onClick={handleNext}
            className="btn-primary w-full py-4 transition-colors active:scale-95"
          >
            {isLast ? "See Final Results" : "next event"}
          </button>
        </>
      )}
    </PageShell>
  );
}

function PageShell({ children, archiveDate }: { children: React.ReactNode; archiveDate?: string }) {
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
