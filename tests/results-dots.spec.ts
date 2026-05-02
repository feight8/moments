// @covers: app/results/page.tsx, components/ResultsCard.tsx, lib/scoring.ts
// @routes: /results
// @feature: results-dots

// NOTE: The emoji dot row in ResultsCard lacks a data-testid, so tests scope
// to the header dots using their parent `title="event N: X pts"` attribute.
// The per-event ScoreDisplay breakdown also renders role="img" tier icons,
// which would otherwise cause strict-mode violations.
// GitHub issue: https://github.com/feight8/moments/issues — see below.

import { test, expect, type Page } from '@playwright/test';
import type { SessionResult } from '../types';

// Mock result covering every tier boundary.
// Scores: gem(110), artifact(85), coin(65), fossil(20), rock(0)
// totalScore = actual sum: 110+85+65+20+0 = 280
const MOCK_RESULT: SessionResult = {
  date: '2025-01-15',
  category: null,
  totalScore: 280,
  maxScore: 550,
  perfectCount: 1,
  streak: 3,
  guesses: [
    {
      eventId: 'e1', guessYear: 2000, correctYear: 2000, score: 110,
      isPerfect: true, description: 'Event one', imageUrl: null, additionalContext: null, revealImageUrl: null,
    },
    {
      eventId: 'e2', guessYear: 1810, correctYear: 1800, score: 85,
      isPerfect: false, description: 'Event two', imageUrl: null, additionalContext: null, revealImageUrl: null,
    },
    {
      eventId: 'e3', guessYear: 1650, correctYear: 1600, score: 65,
      isPerfect: false, description: 'Event three', imageUrl: null, additionalContext: null, revealImageUrl: null,
    },
    {
      eventId: 'e4', guessYear: 1150, correctYear: 1100, score: 20,
      isPerfect: false, description: 'Event four', imageUrl: null, additionalContext: null, revealImageUrl: null,
    },
    {
      eventId: 'e5', guessYear: 1400, correctYear: 1100, score: 0,
      isPerfect: false, description: 'Event five', imageUrl: null, additionalContext: null, revealImageUrl: null,
    },
  ],
};

async function loadWithResult(page: Page, result: SessionResult) {
  await page.addInitScript((r: SessionResult) => {
    sessionStorage.setItem('circa_result', JSON.stringify(r));
  }, result);
  await page.goto('/results');
  await expect(page.getByRole('button', { name: 'share results' })).toBeVisible({ timeout: 10000 });
}

// The header dot row uses parent divs with title="event N: X pts".
// ScoreDisplay does NOT use title, so this scopes to the header only.
function headerDot(page: Page, eventNumber: number, score: number) {
  return page.locator(`[title="event ${eventNumber}: ${score} pts"]`).getByRole('img');
}

test.describe('Results page — emoji dot colours', () => {
  test.beforeEach(async ({ page }) => {
    await loadWithResult(page, MOCK_RESULT);
  });

  test('renders exactly 5 dot icons in the header row', async ({ page }) => {
    // Parent divs carry title="event N: X pts" — one per guess
    const headerDots = page.locator('[title^="event"][title$="pts"]');
    await expect(headerDots).toHaveCount(5);
  });

  test('score 110 → gem dot (💎)', async ({ page }) => {
    const dot = headerDot(page, 1, 110);
    await expect(dot).toBeVisible();
    await expect(dot).toHaveAttribute('aria-label', 'gem');
    await expect(dot).toHaveText('💎');
  });

  test('score 85 → artifact dot (🏺)', async ({ page }) => {
    const dot = headerDot(page, 2, 85);
    await expect(dot).toBeVisible();
    await expect(dot).toHaveAttribute('aria-label', 'artifact');
    await expect(dot).toHaveText('🏺');
  });

  test('score 65 → coin dot (🪙)', async ({ page }) => {
    const dot = headerDot(page, 3, 65);
    await expect(dot).toBeVisible();
    await expect(dot).toHaveAttribute('aria-label', 'coin');
    await expect(dot).toHaveText('🪙');
  });

  test('score 20 → fossil dot (🦴)', async ({ page }) => {
    const dot = headerDot(page, 4, 20);
    await expect(dot).toBeVisible();
    await expect(dot).toHaveAttribute('aria-label', 'fossil');
    await expect(dot).toHaveText('🦴');
  });

  test('score 0 → rock dot (🪨)', async ({ page }) => {
    const dot = headerDot(page, 5, 0);
    await expect(dot).toBeVisible();
    await expect(dot).toHaveAttribute('aria-label', 'rock');
    await expect(dot).toHaveText('🪨');
  });

  test('total score section is displayed', async ({ page }) => {
    // NOTE: adding data-testid="total-score" to the score section in ResultsCard
    // would make this selector more robust — see GitHub issue raised below.
    await expect(page.getByText('total score')).toBeVisible();
    // Share preview uniquely formats the total: "score: 280/500 (+10 perfect)"
    await expect(page.locator('pre')).toContainText('score: 280/500');
  });

  test('share results button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'share results' })).toBeVisible();
  });

  test('streak badge shows for non-zero streak', async ({ page }) => {
    // StreakBadge renders "{n} days" when streak > 0; returns null for streak=0
    await expect(page.getByText('3 days')).toBeVisible();
  });

  test('share preview contains all tier emojis', async ({ page }) => {
    const preview = page.locator('pre');
    await expect(preview).toContainText('💎');
    await expect(preview).toContainText('🏺');
    await expect(preview).toContainText('🪙');
    await expect(preview).toContainText('🦴');
    await expect(preview).toContainText('🪨');
  });
});

test.describe('Results page — tier boundary edge cases', () => {
  function makeResult(scores: number[]): SessionResult {
    return {
      ...MOCK_RESULT,
      totalScore: scores.reduce((a, b) => a + b, 0),
      perfectCount: scores.filter((s) => s === 110).length,
      streak: 0,
      guesses: scores.map((score, i) => ({
        eventId: `edge-${i}`,
        guessYear: 1500,
        correctYear: 1500,
        score,
        isPerfect: score === 110,
        description: `Event ${i + 1}`,
        imageUrl: null,
        additionalContext: null,
        revealImageUrl: null,
      })),
    };
  }

  // Count only header-row dots (scoped by title attribute)
  function countHeaderDotsByTier(page: Page, tier: string) {
    return page.locator(`[title^="event"][title$="pts"]`).filter({
      has: page.locator(`[role="img"][aria-label="${tier}"]`),
    });
  }

  test('score 84 → coin (just below artifact threshold of 85)', async ({ page }) => {
    await loadWithResult(page, makeResult([84, 84, 84, 84, 84]));
    await expect(countHeaderDotsByTier(page, 'coin')).toHaveCount(5);
    await expect(countHeaderDotsByTier(page, 'artifact')).toHaveCount(0);
  });

  test('score 64 → fossil (just below coin threshold of 65)', async ({ page }) => {
    await loadWithResult(page, makeResult([64, 64, 64, 64, 64]));
    await expect(countHeaderDotsByTier(page, 'fossil')).toHaveCount(5);
    await expect(countHeaderDotsByTier(page, 'coin')).toHaveCount(0);
  });

  test('score 19 → rock (just below fossil threshold of 20)', async ({ page }) => {
    await loadWithResult(page, makeResult([19, 19, 19, 19, 19]));
    await expect(countHeaderDotsByTier(page, 'rock')).toHaveCount(5);
    await expect(countHeaderDotsByTier(page, 'fossil')).toHaveCount(0);
  });
});
