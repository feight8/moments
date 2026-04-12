/**
 * Scoring logic for Moments.
 *
 * Each event is worth up to 100 base points, plus a 10-point bonus for an
 * exact year match (110 max per event, 550 max per 5-event session).
 *
 * Score degrades along a smooth polynomial curve — no step cliffs.
 * At 1000+ years off, score is 0.
 */

const BASE_MAX = 100;
const PERFECT_BONUS = 10;
const MAX_DISTANCE = 150; // years; beyond this score is 0
const EXPONENT = 2.0;

export const MAX_SCORE_PER_EVENT = BASE_MAX + PERFECT_BONUS; // 110
export const MAX_SESSION_SCORE = MAX_SCORE_PER_EVENT * 5;    // 550
export const EVENTS_PER_SESSION = 5;

/** Slider bounds — 1000 CE to present day. */
export const YEAR_MIN = 1000;
export const YEAR_MAX = 2025;

/**
 * Score a single guess.
 *
 * @param guessYear   - The year the user guessed (integer, 1–2025)
 * @param correctYear - The actual year of the event (integer, 1–2025)
 * @returns           Score in range [0, 110]
 */
export function scoreGuess(guessYear: number, correctYear: number): number {
  const distance = Math.abs(guessYear - correctYear);

  if (distance === 0) return BASE_MAX + PERFECT_BONUS;
  if (distance >= MAX_DISTANCE) return 0;

  const ratio = distance / MAX_DISTANCE;
  return Math.round(BASE_MAX * Math.pow(1 - ratio, EXPONENT));
}

/** Whether a guess was a perfect (exact) hit. */
export function isPerfect(guessYear: number, correctYear: number): boolean {
  return guessYear === correctYear;
}

/** Sum scores across all 5 events in a session. */
export function scoreSession(
  guesses: Array<{ guessYear: number; correctYear: number }>
): number {
  return guesses.reduce((sum, g) => sum + scoreGuess(g.guessYear, g.correctYear), 0);
}

export type DigTier = 'gem' | 'artifact' | 'coin' | 'fossil' | 'rock';

/**
 * Map a per-event score to its archaeological dig tier.
 *
 * gem      = 110   (exact year — perfect find)
 * artifact ≥ 85   (~within 10 years)
 * coin     ≥ 65   (~within 25 years)
 * fossil   ≥ 20   (~within 75 years)
 * rock     < 20   (75+ years off, or 0)
 */
export function scoreToDot(score: number): DigTier {
  if (score >= 110) return 'gem';
  if (score >= 85)  return 'artifact';
  if (score >= 65)  return 'coin';
  if (score >= 20)  return 'fossil';
  return 'rock';
}

export const DOT_EMOJI: Record<DigTier, string> = {
  gem:      '💎',
  artifact: '🏺',
  coin:     '🪙',
  fossil:   '🦴',
  rock:     '🪨',
};

/**
 * Build the emoji row string used in the share card.
 * e.g. "💎 🏺 🪙 🦴 🪨"
 */
export function buildEmojiRow(scores: number[]): string {
  return scores.map((s) => DOT_EMOJI[scoreToDot(s)]).join(' ');
}
