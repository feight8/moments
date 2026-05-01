# Moments

A daily history guessing game. Each day, five historical events are described in 2–3 sentences — with the year removed. Drag a slider to guess when each event happened. Score points based on accuracy, build streaks, and share your results.

## Features

- **Daily puzzle** — 5 new historical events every day, same for all players
- **Year slider** — drag to pick your guess; smooth UX with keyboard support
- **Proximity scoring** — up to 1000 points per event; score drops with distance from the correct year
- **Streak tracking** — consecutive daily completions tracked per user
- **Shareable results card** — emoji dot grid (green/yellow/orange/red) you can copy or share
- **Anonymous play** — no sign-up required; optionally link an account to preserve your streak
- **Leaderboard** _(planned)_ — daily and all-time rankings

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS |
| Language | TypeScript |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))

### Local Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd moments
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in your Supabase URL and keys

# 3. Run database migrations
# Apply files in supabase/migrations/ via Supabase dashboard or CLI

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## How Scoring Works

Each event is worth up to **100 base points**, plus a **+10 bonus for an exact hit**.

Score decays smoothly — no arbitrary cliffs. Every year closer matters.

| Distance from correct year | Points |
|---------------------------|--------|
| Exact | 110 (includes +10 bonus) |
| ~10 years | ~98 |
| ~50 years | ~88 |
| ~100 years | ~77 |
| ~200 years | ~57 |
| ~500 years | ~18 |
| ≥ 1000 years | 0 |

Max score per session: **550 points** (all 5 perfect) / **500 base**

## Emoji Share Card

After each session, copy a result like this to share:

```
Moments — April 7, 2026
🟢 🟡 🟢 🔴 🟢
Score: 382 / 500 | Streak: 🔥 4
```

## Project Structure

See [CLAUDE.md](CLAUDE.md) for a detailed breakdown of the codebase structure and architecture decisions.

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

Category puzzles are admin-only by default. Set `CATEGORIES_ENABLED=true` in your environment to open them to all users.

You can combine both params to preview a future category puzzle:

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
  ('Description of event two.', 1815),
  -- ... (5 total)
;

-- Then create the puzzle pointing to those events
INSERT INTO daily_puzzles (date, category, event_ids)
VALUES ('2026-05-10', 'sports', ARRAY[<id1>, <id2>, <id3>, <id4>, <id5>]);
```

Leave `category` as `NULL` for the main daily puzzle.

---

### Opening Categories to All Users

Once you're ready to launch categories publicly, set:

```
CATEGORIES_ENABLED=true
```

This makes the category section visible on the homepage and removes the admin gate from the category play routes. No code deploy needed — just an environment variable change in Vercel.

---

## Roadmap

- [x] Project planning and schema design
- [ ] Next.js project scaffold
- [ ] Supabase schema + migrations
- [ ] Daily puzzle API
- [ ] Year slider component
- [ ] Scoring engine
- [ ] Results + share card
- [ ] Streak system
- [ ] Leaderboard (phase 2)
- [ ] Admin event seeding UI (phase 2)
- [ ] Social auth (phase 3)
