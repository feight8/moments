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
