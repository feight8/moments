// @covers: app/api/submit/route.ts, lib/scoring.ts
// @routes: /api/submit, /api/daily
// @feature: submit-validation

import { test, expect, type APIRequestContext } from '@playwright/test';

// Obtain an anonymous Supabase access token so auth-gated validation tests
// can reach the body-validation logic in /api/submit. Returns null when the
// Supabase env vars are absent (e.g. staging runs that don't expose them).
async function getAnonToken(request: APIRequestContext): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const res = await request.post(`${supabaseUrl}/auth/v1/signup`, {
      headers: { apikey: supabaseAnonKey },
      data: { data: {}, gotrue_meta_security: {} },
    });
    if (!res.ok()) return null;
    const { access_token } = await res.json() as { access_token?: string };
    return access_token ?? null;
  } catch {
    return null;
  }
}

// Fetch the event IDs for today's puzzle. Needed to build valid guess payloads
// so that the per-guess validation in /api/submit is actually reached.
async function getTodayEventIds(request: APIRequestContext): Promise<string[] | null> {
  const res = await request.get('/api/daily');
  if (!res.ok()) return null;
  const { events } = await res.json() as { events: Array<{ id: string }> };
  return events?.map((e) => e.id) ?? null;
}

test.describe('POST /api/submit — unauthenticated', () => {
  // Use native fetch (no cookie store) rather than the `request` fixture,
  // which inherits storageState and would send the Supabase auth cookie,
  // making the request authenticated and returning 400 instead of 401.
  test('returns 401 without an auth header', async () => {
    const res = await fetch('http://localhost:3000/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guesses: [] }),
    });
    expect(res.status).toBe(401);
  });
});

test.describe('POST /api/submit — body validation (requires Supabase auth)', () => {
  let token: string | null = null;

  test.beforeAll(async ({ request }) => {
    token = await getAnonToken(request);
  });

  test('returns 400 for wrong number of guesses (fewer than 5)', async ({ request }) => {
    test.skip(!token, 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set');

    const res = await request.post('/api/submit', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        guesses: [{ eventId: 'x', guessYear: 1500 }], // only 1 guess
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/5 guesses/i);
  });

  test('returns 400 for guess year below YEAR_MIN (999 < 1000)', async ({ request }) => {
    test.skip(!token, 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set');

    const eventIds = await getTodayEventIds(request);
    test.skip(!eventIds, 'No daily puzzle available — cannot test year-range validation');

    const guesses = eventIds!.map((id) => ({ eventId: id, guessYear: 999 }));
    const res = await request.post('/api/submit', {
      headers: { Authorization: `Bearer ${token}` },
      data: { guesses },
    });
    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/out of range/i);
  });

  test('returns 400 for guess year above YEAR_MAX (2026 > 2025)', async ({ request }) => {
    test.skip(!token, 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set');

    const eventIds = await getTodayEventIds(request);
    test.skip(!eventIds, 'No daily puzzle available — cannot test year-range validation');

    const guesses = eventIds!.map((id) => ({ eventId: id, guessYear: 2026 }));
    const res = await request.post('/api/submit', {
      headers: { Authorization: `Bearer ${token}` },
      data: { guesses },
    });
    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/out of range/i);
  });

  test('returns 400 for a non-integer guess year (float)', async ({ request }) => {
    test.skip(!token, 'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set');

    const eventIds = await getTodayEventIds(request);
    test.skip(!eventIds, 'No daily puzzle available — cannot test year-range validation');

    const guesses = eventIds!.map((id) => ({ eventId: id, guessYear: 1500.5 }));
    const res = await request.post('/api/submit', {
      headers: { Authorization: `Bearer ${token}` },
      data: { guesses },
    });
    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/out of range/i);
  });
});
