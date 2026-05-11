// Shared anonymous Supabase session used by all browser test projects.
// Supabase anonymous auth is rate-limited (~30 new users/hour on the free
// tier). This setup creates one session and caches it for up to 50 minutes,
// so repeated local test runs share the same anonymous user instead of
// creating dozens of new ones.

import { test as setup, expect } from '@playwright/test';
import fs from 'fs';

const AUTH_FILE = 'playwright/.auth/user.json';
const MAX_AGE_MS = 50 * 60 * 1000; // 50 minutes (Supabase tokens last 1 hour)

setup('create anonymous session', async ({ page }) => {
  // Reuse the cached auth file if it is still fresh
  if (fs.existsSync(AUTH_FILE)) {
    const ageMs = Date.now() - fs.statSync(AUTH_FILE).mtimeMs;
    if (ageMs < MAX_AGE_MS) {
      return; // valid session on disk — nothing to do
    }
  }

  fs.mkdirSync('playwright/.auth', { recursive: true });

  // Navigate to /play so the app signs in anonymously and loads the puzzle
  await page.goto('/play');
  await expect(page.locator('[data-testid="event-card"]').first())
    .toBeVisible({ timeout: 20000 });

  // Save localStorage (contains the Supabase access + refresh tokens)
  await page.context().storageState({ path: AUTH_FILE });
});
