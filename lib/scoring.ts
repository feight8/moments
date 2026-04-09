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
const MAX_DISTANCE = 250; // years; beyond this score is 0
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

export type DotColor = 'green' | 'yellow' | 'orange' | 'red';

/**
 * Map a per-event score to its emoji dot color.
 *
 * green  ≥ 80   (~within 25 years)
 * yellow ≥ 50   (~within 60 years)
 * orange ≥ 20   (~within 100 years)
 * red    < 20   (100+ years off)
 */
export function scoreToDot(score: number): DotColor {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  if (score >= 20) return 'orange';
  return 'red';
}

export const DOT_EMOJI: Record<DotColor, string> = {
  green:  '🟢',
  yellow: '🟡',
  orange: '🟠',
  red:    '🔴',
};

/**
 * Build the emoji row string used in the share card.
 * e.g. "🟢 🟡 🟢 🔴 🟢"
 */
export function buildEmojiRow(scores: number[]): string {
  return scores.map((s) => DOT_EMOJI[scoreToDot(s)]).join(' ');
}
