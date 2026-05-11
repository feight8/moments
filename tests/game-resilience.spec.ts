// @covers: components/YearSlider.tsx, app/play/page.tsx, components/EventCard.tsx
// @routes: /play
// @feature: game-resilience

// Tests that accidental screen interactions — tapping the wrong area, swiping,
// reloading the page — do not corrupt game state or submit an unexpected guess.
// Touch tests run in a 390×844 mobile viewport with touch enabled.

import { test, expect } from '@playwright/test';

// slider default: Math.round((YEAR_MIN + YEAR_MAX) / 2) = Math.round((1000+2025)/2) = 1513
const MID_YEAR = 1513;

// Dispatch a synthetic horizontal touch drag on the slider track element.
// The track is the immediate parent of input[type="range"] and has the
// touchstart/touchmove/touchend listeners registered by YearSlider.
async function touchDragSlider(
  page: import('@playwright/test').Page,
  fromFraction: number, // 0–1 position along the track width
  toFraction: number,
) {
  const box = await page.locator('input[type="range"]').boundingBox();
  if (!box) throw new Error('slider range input not found');

  const y = box.y + box.height / 2;
  const x1 = box.x + box.width * fromFraction;
  const x2 = box.x + box.width * toFraction;

  await page.evaluate(([sx, sy, ex, ey]: number[]) => {
    const track = document.querySelector('input[type="range"]')?.parentElement;
    if (!track) return;
    const mk = (x: number, y: number) =>
      new Touch({ identifier: 1, target: track, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y });
    track.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [mk(sx, sy)] }));
    track.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: false, touches: [mk(ex, ey)] }));
    track.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, changedTouches: [mk(ex, ey)], touches: [] }));
  }, [x1, y, x2, y]);
}

// ---------------------------------------------------------------------------
// Pointer / keyboard interference
// ---------------------------------------------------------------------------

test.describe('Game resilience — pointer and keyboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/play');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 20_000 });
  });

  test('clicking the event card does not submit or advance the game', async ({ page }) => {
    const card = page.locator('[data-testid="event-card"]');
    await card.click();
    await card.click();
    await card.click();

    // Still on event 1 — game has not advanced
    // NOTE: ProgressBar renders "1 / 5" as plain text with no data-testid.
    // Tracked in: https://github.com/feight8/moments/issues/16
    await expect(page.getByText('1 / 5')).toBeVisible();
    await expect(page.getByRole('button', { name: /lock in/i })).toBeVisible();
  });

  test('clicking outside the slider does not reset the slider year', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await slider.focus();

    // Advance 100 steps right from default
    for (let i = 0; i < 100; i++) await page.keyboard.press('ArrowRight');

    const yearBefore = await slider.inputValue();
    expect(parseInt(yearBefore)).toBe(MID_YEAR + 100);

    // Click on the event card — should produce no state change
    await page.locator('[data-testid="event-card"]').click();

    expect(await slider.inputValue()).toBe(yearBefore);
  });

  test('pressing Escape in the year text input cancels the edit without submitting', async ({ page }) => {
    const yearInput = page.locator('input[aria-label="Year guess - type or use the slider"]');
    await yearInput.click();

    // Type a year, then cancel
    await yearInput.fill('1066');
    await page.keyboard.press('Escape');

    // Game must still be on event 1 — Escape must not have triggered submission
    await expect(page.getByText('1 / 5')).toBeVisible();
    await expect(page.getByRole('button', { name: /lock in/i })).toBeVisible();
  });

  test('scrolling the page does not change the slider year', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await slider.focus();
    for (let i = 0; i < 200; i++) await page.keyboard.press('ArrowRight');
    const yearBefore = await slider.inputValue();

    // Scroll down and back
    await page.evaluate(() => { window.scrollBy(0, 400); window.scrollBy(0, -400); });

    expect(await slider.inputValue()).toBe(yearBefore);
  });

  test('page reload before any guess submission stays on question 1', async ({ page }) => {
    // Move slider but do not submit — no progress has been persisted yet
    const slider = page.locator('input[type="range"]');
    await slider.focus();
    for (let i = 0; i < 100; i++) await page.keyboard.press('ArrowRight');

    await page.reload();
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 20_000 });

    // Still event 1 (no progress to restore) with default slider year
    await expect(page.getByText('1 / 5')).toBeVisible();
    await expect(page.getByRole('button', { name: /lock in/i })).toBeVisible();
    expect(parseInt(await slider.inputValue())).toBe(MID_YEAR);
  });

  test('page reload after advancing to question 2 resumes on question 2', async ({ page }) => {
    // Lock in a guess for Q1
    await page.getByRole('button', { name: /lock in/i }).click();
    // Wait for the reveal — the "next event" button appears after the API responds
    await expect(page.getByRole('button', { name: 'next event' })).toBeVisible({ timeout: 15_000 });
    // Advance to Q2 — this triggers saveGameProgress({ currentIndex: 1, guesses: [g1] })
    await page.getByRole('button', { name: 'next event' }).click();
    await expect(page.getByText('2 / 5')).toBeVisible({ timeout: 5_000 });

    // Simulate pull-to-refresh
    await page.reload();
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 20_000 });

    // Should resume on Q2, not reset to Q1
    await expect(page.getByText('2 / 5')).toBeVisible();
    await expect(page.getByRole('button', { name: /lock in/i })).toBeVisible();
  });

  test('rapid double-click on lock-in button leaves game in a valid state', async ({ page }) => {
    // Double-click fires two clicks before any re-render. The route call from
    // the first click will be in-flight when the second fires. The game should
    // end up in "revealing" (first guess accepted) or "guessing" (second click
    // was ignored), never in an error state.
    await page.getByRole('button', { name: /lock in/i }).dblclick();

    // Wait briefly for any async response
    await page.waitForTimeout(1500);

    // The event card must still be visible — game has not errored out
    await expect(page.locator('[data-testid="event-card"]')).toBeVisible();

    // No unrecoverable error should be shown
    await expect(page.getByText(/connection lost/i)).not.toBeVisible();
    await expect(page.getByText(/something went wrong saving/i)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Touch interactions (mobile viewport)
// ---------------------------------------------------------------------------

test.describe('Game resilience — touch', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/play');
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 20_000 });
  });

  test('tapping the event card with touch does not advance or submit the game', async ({ page }) => {
    const card = page.locator('[data-testid="event-card"]');
    await card.tap();
    await card.tap();
    await card.tap();

    await expect(page.getByText('1 / 5')).toBeVisible();
    await expect(page.getByRole('button', { name: /lock in/i })).toBeVisible();
  });

  test('horizontal touch drag on slider moves the year in the correct direction', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit bundle does not expose the Touch() constructor for synthetic touch dispatch');
    const slider = page.locator('input[type="range"]');
    const yearBefore = parseInt(await slider.inputValue());

    // Drag from 25% to 75% — should increase the year
    await touchDragSlider(page, 0.25, 0.75);

    const yearAfter = parseInt(await slider.inputValue());
    expect(yearAfter).toBeGreaterThan(yearBefore);

    // And dragging back left should decrease it
    await touchDragSlider(page, 0.75, 0.25);
    const yearFinal = parseInt(await slider.inputValue());
    expect(yearFinal).toBeLessThan(yearAfter);
  });

  test('touch drag on slider does not cause the page to scroll', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit bundle does not expose the Touch() constructor for synthetic touch dispatch');
    // Drag right across the full slider — the non-passive touchmove listener
    // calls preventDefault() to block iOS Safari page scroll.
    await touchDragSlider(page, 0.1, 0.9);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('vertical touch swipe on the event card does not change the slider year', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Playwright WebKit bundle does not expose the Touch() constructor for synthetic touch dispatch');
    const slider = page.locator('input[type="range"]');

    // Move slider to a known non-default position first
    await slider.focus();
    for (let i = 0; i < 50; i++) await page.keyboard.press('ArrowRight');
    const yearBefore = await slider.inputValue();

    // Dispatch a vertical touch drag on the event card (simulates trying to scroll)
    const card = page.locator('[data-testid="event-card"]');
    const box = await card.boundingBox();
    if (!box) throw new Error('event card not found');

    const cx = box.x + box.width / 2;
    const startY = box.y + box.height * 0.25;
    const endY = box.y + box.height * 0.75;

    await page.evaluate(([x, sy, ey]: number[]) => {
      const el = document.elementFromPoint(x, sy) as Element | null;
      if (!el) return;
      const mk = (px: number, py: number) =>
        new Touch({ identifier: 2, target: el, clientX: px, clientY: py, pageX: px, pageY: py, screenX: px, screenY: py });
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [mk(x, sy)] }));
      el.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [mk(x, ey)] }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, changedTouches: [mk(x, ey)], touches: [] }));
    }, [cx, startY, endY]);

    // Slider year must be unchanged
    expect(await slider.inputValue()).toBe(yearBefore);
  });

  test('tapping the progress bar with touch does not affect game state', async ({ page }) => {
    const slider = page.locator('input[type="range"]');
    await slider.focus();
    for (let i = 0; i < 50; i++) await page.keyboard.press('ArrowRight');
    const yearBefore = await slider.inputValue();

    // Tap the progress "1 / 5" text area
    await page.getByText('1 / 5').tap();

    await expect(page.getByText('1 / 5')).toBeVisible();
    await expect(page.getByRole('button', { name: /lock in/i })).toBeVisible();
    expect(await slider.inputValue()).toBe(yearBefore);
  });
});
