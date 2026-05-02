# Circa

A daily history guessing game at [circagame.com](https://circagame.com). Each day, five historical events are described in 2–3 sentences — with the year removed. Drag a slider to guess when each event happened, score points for accuracy, and build a streak.

## Features

- **Daily puzzle** — 5 new historical events every day, same for all players
- **Year slider** — drag to pick your guess (range: 1000 CE – 2025)
- **Proximity scoring** — up to 110 points per event; score decays by era-scaled distance from the correct year
- **Dig-tier results** — 💎 gem / 🏺 artifact / 🪙 coin / 🦴 fossil / 🪨 rock based on accuracy
- **Streak tracking** — consecutive daily completions tracked per user
- **Shareable results card** — emoji row you can copy or share
- **Anonymous play** — no sign-up required; link an account to preserve your streak
- **Circa+** — paid subscription with archive access, streak shields, and group leaderboards
- **Groups** — create or join a friend group and compare scores each day
- **Category puzzles** — themed daily puzzles (sports, pop culture, science, etc.) — admin-gated by default

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Payments | Stripe |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- A Stripe account (for Circa+ payments)

### Local Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd moments
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your Supabase URL, keys, and Stripe keys

# 3. Run database migrations
# Apply files in supabase/migrations/ in order via Supabase dashboard or CLI

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

PLUS_ADMIN_USER_IDS=        # comma-separated Supabase UUIDs for admin access
CATEGORIES_ENABLED=false    # set to true to open category puzzles to all users
```

## How Scoring Works

Each event is worth up to **100 base points**, plus a **+10 bonus for an exact year match** (110 max per event, 550 max session).

Score decays along a smooth polynomial curve. The zero-score threshold scales with the event's era — ancient events are harder to pinpoint, so they get more leniency:

| Era | Zero score at |
|-----|--------------|
| 1900 – present | 150 years off |
| 1700 – 1899 | 200 years off |
| 1500 – 1699 | 275 years off |
| 1200 – 1499 | 375 years off |
| 1000 – 1199 | 475 years off |

## Dig Tiers

Results use an archaeological dig metaphor:

| Tier | Emoji | Score |
|------|-------|-------|
| Gem | 💎 | 110 (exact year) |
| Artifact | 🏺 | ≥ 85 |
| Coin | 🪙 | ≥ 65 |
| Fossil | 🦴 | ≥ 20 |
| Rock | 🪨 | < 20 |

Example share card:
```
Circa — May 2, 2026
💎 🏺 🪙 🦴 💎
Score: 412 / 550 | Streak: 🔥 7
```

## Project Structure

See [CLAUDE.md](CLAUDE.md) for a full breakdown of routes, components, and architecture decisions.

## Admin Guide

### Becoming an Admin

Add your Supabase user UUID to the `PLUS_ADMIN_USER_IDS` environment variable (comma-separated for multiple admins):

```
PLUS_ADMIN_USER_IDS=your-uuid-here,another-uuid-here
```

Admins get full Circa+ access and can preview future puzzles and category puzzles before they go public.

---

### Playing a Future Date

Append `?date=YYYY-MM-DD` to the play URL:

```
https://circagame.com/play?date=2026-05-10
```

A puzzle must be seeded for that date in the `daily_puzzles` table first. Only admins can access future dates — other users get a 404.

---

### Playing a Category Puzzle

Append `?category=<slug>` to the play URL:

```
https://circagame.com/play?category=sports
https://circagame.com/play?category=pop-culture
https://circagame.com/play?category=science
https://circagame.com/play?category=arts
https://circagame.com/play?category=politics
```

Category puzzles are admin-only by default. Set `CATEGORIES_ENABLED=true` in your environment to open them to all users. You can combine both params to preview a future category puzzle:

```
https://circagame.com/play?date=2026-05-10&category=sports
```

---

### Seeding a Category Puzzle

Insert a row into `daily_puzzles` with the `category` column set:

```sql
-- First, insert the events
INSERT INTO events (description, year) VALUES
  ('Description of event one.', 1969),
  ('Description of event two.', 1815)
  -- ... (5 total)
;

-- Then create the puzzle pointing to those events
INSERT INTO daily_puzzles (date, category, event_ids)
VALUES ('2026-05-10', 'sports', ARRAY[<id1>, <id2>, <id3>, <id4>, <id5>]);
```

Leave `category` as `NULL` for the main daily puzzle.

---

### Opening Categories to All Users

```
CATEGORIES_ENABLED=true
```

This makes the category section visible on the homepage and removes the admin gate — no code deploy needed, just a Vercel environment variable change.

---

## Running Tests

```bash
npx playwright test tests/smoke/    # Smoke tests (auto-starts dev server)
npx playwright test                 # Full test suite
```
