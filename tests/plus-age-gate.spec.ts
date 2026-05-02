// @covers: app/plus/page.tsx
// @feature: coppa, age-gate

import { test, expect } from '@playwright/test';

test.describe('Circa+ age gate (COPPA)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/plus');
    // Wait for the page to hydrate and pricing cards to render
    await expect(page.getByTestId('age-gate-checkbox')).toBeVisible();
  });

  test('age confirmation checkbox is present and unchecked by default', async ({ page }) => {
    const checkbox = page.getByTestId('age-gate-checkbox');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  });

  test('subscribe buttons are disabled before age is confirmed', async ({ page }) => {
    const annualBtn = page.getByRole('button', { name: /subscribe annually/i });
    const monthlyBtn = page.getByRole('button', { name: /subscribe monthly/i });
    await expect(annualBtn).toBeDisabled();
    await expect(monthlyBtn).toBeDisabled();
  });

  test('subscribe buttons enable after checking the age confirmation', async ({ page }) => {
    await page.getByTestId('age-gate-checkbox').check();
    const annualBtn = page.getByRole('button', { name: /subscribe annually/i });
    const monthlyBtn = page.getByRole('button', { name: /subscribe monthly/i });
    await expect(annualBtn).toBeEnabled();
    await expect(monthlyBtn).toBeEnabled();
  });

  test('unchecking the box disables buttons again', async ({ page }) => {
    const checkbox = page.getByTestId('age-gate-checkbox');
    await checkbox.check();
    await expect(page.getByRole('button', { name: /subscribe annually/i })).toBeEnabled();
    await checkbox.uncheck();
    await expect(page.getByRole('button', { name: /subscribe annually/i })).toBeDisabled();
    await expect(page.getByRole('button', { name: /subscribe monthly/i })).toBeDisabled();
  });
});
