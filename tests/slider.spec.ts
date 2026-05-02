// @covers: components/YearSlider.tsx, lib/scoring.ts, app/play/page.tsx
// @routes: /play
// @feature: year-slider

import { test, expect } from '@playwright/test';

// NOTE: YEAR_MIN is 1000 (not 1 as CLAUDE.md states). The slider is bounded
// to 1000–2025. Tests use the actual constants from lib/scoring.ts.

test.describe('YearSlider', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/play');
    // Wait for the puzzle to finish loading before interacting with the slider
    await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('slider has correct min and max attributes (1000–2025)', async ({ page }) => {
    const slider = page.getByRole('slider');
    await expect(slider).toHaveAttribute('min', '1000');
    await expect(slider).toHaveAttribute('max', '2025');
    await expect(slider).toHaveAttribute('aria-valuemin', '1000');
    await expect(slider).toHaveAttribute('aria-valuemax', '2025');
  });

  test('initial slider value is within the valid range', async ({ page }) => {
    const slider = page.getByRole('slider');
    const valuenow = await slider.getAttribute('aria-valuenow');
    const year = Number(valuenow);
    expect(year).toBeGreaterThanOrEqual(1000);
    expect(year).toBeLessThanOrEqual(2025);
  });

  test('ArrowRight increases value by 1', async ({ page }) => {
    const slider = page.getByRole('slider');
    await slider.focus();

    const before = Number(await slider.getAttribute('aria-valuenow'));
    // Move away from max first to ensure there's room to increment
    if (before === 2025) {
      await page.keyboard.press('ArrowLeft');
    }
    const baseline = Number(await slider.getAttribute('aria-valuenow'));
    await page.keyboard.press('ArrowRight');
    const after = Number(await slider.getAttribute('aria-valuenow'));
    expect(after).toBe(baseline + 1);
  });

  test('ArrowLeft decreases value by 1', async ({ page }) => {
    const slider = page.getByRole('slider');
    await slider.focus();

    // Move away from min to ensure there's room to decrement
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const before = Number(await slider.getAttribute('aria-valuenow'));
    await page.keyboard.press('ArrowLeft');
    const after = Number(await slider.getAttribute('aria-valuenow'));
    expect(after).toBe(before - 1);
  });

  test('Shift+ArrowRight moves value by 10', async ({ page }) => {
    const slider = page.getByRole('slider');
    await slider.focus();

    // Position slider at a known value well away from the bounds
    const yearInput = page.getByLabel('Year guess - type or use the slider');
    await yearInput.click();
    await yearInput.fill('1500');
    await yearInput.press('Enter');

    const before = Number(await slider.getAttribute('aria-valuenow'));
    await slider.focus();
    await page.keyboard.press('Shift+ArrowRight');
    const after = Number(await slider.getAttribute('aria-valuenow'));
    expect(after).toBe(before + 10);
  });

  test('Shift+ArrowLeft moves value by 10', async ({ page }) => {
    const slider = page.getByRole('slider');

    const yearInput = page.getByLabel('Year guess - type or use the slider');
    await yearInput.click();
    await yearInput.fill('1500');
    await yearInput.press('Enter');

    await slider.focus();
    const before = Number(await slider.getAttribute('aria-valuenow'));
    await page.keyboard.press('Shift+ArrowLeft');
    const after = Number(await slider.getAttribute('aria-valuenow'));
    expect(after).toBe(before - 10);
  });

  test('typing a valid year in the text input updates the slider', async ({ page }) => {
    const yearInput = page.getByLabel('Year guess - type or use the slider');
    await yearInput.click();
    await yearInput.fill('1776');
    await yearInput.press('Enter');

    const slider = page.getByRole('slider');
    await expect(slider).toHaveAttribute('aria-valuenow', '1776');
  });

  test('typing a year below YEAR_MIN (1000) clamps to 1000', async ({ page }) => {
    const yearInput = page.getByLabel('Year guess - type or use the slider');
    await yearInput.click();
    await yearInput.fill('500');
    await yearInput.press('Enter');

    const slider = page.getByRole('slider');
    await expect(slider).toHaveAttribute('aria-valuenow', '1000');
  });

  test('typing a year above YEAR_MAX (2025) clamps to 2025', async ({ page }) => {
    const yearInput = page.getByLabel('Year guess - type or use the slider');
    await yearInput.click();
    await yearInput.fill('3000');
    await yearInput.press('Enter');

    const slider = page.getByRole('slider');
    await expect(slider).toHaveAttribute('aria-valuenow', '2025');
  });

  test('slider does not accept a year of 0', async ({ page }) => {
    const yearInput = page.getByLabel('Year guess - type or use the slider');
    await yearInput.click();
    await yearInput.fill('0');
    await yearInput.press('Enter');

    const slider = page.getByRole('slider');
    await expect(slider).toHaveAttribute('aria-valuenow', '1000');
  });

  test('slider does not accept a year above 2025', async ({ page }) => {
    const yearInput = page.getByLabel('Year guess - type or use the slider');
    await yearInput.click();
    await yearInput.fill('2026');
    await yearInput.press('Enter');

    const slider = page.getByRole('slider');
    await expect(slider).toHaveAttribute('aria-valuenow', '2025');
  });
});
