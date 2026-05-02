// @covers: app/layout.tsx, app/page.tsx
// @routes: /
// @feature: smoke

import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/circa/i);
});

test('play page loads', async ({ page }) => {
  await page.goto('/play');
  await expect(page.locator('[data-testid="event-card"]').first()).toBeVisible({ timeout: 10000 });
});

test('daily API responds', async ({ request }) => {
  const res = await request.get('/api/daily');
  expect(res.ok()).toBeTruthy();
});

test('daily API never returns year field', async ({ request }) => {
  const res = await request.get('/api/daily');
  const data = await res.json();
  for (const event of data.events) {
    expect(event).not.toHaveProperty('year');
  }
});