# CLAUDE.md — Moments Project

## Project Overview

**Moments** is a daily history guessing game. Each day, users read 2–3 sentence descriptions of 5 historical events (year omitted) and drag a slider to guess the year. They're scored by proximity to the correct year, can build streaks, share results via emoji cards, and will eventually compete on a leaderboard.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## Project Structure

```
moments/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home / today's puzzle
│   ├── play/
│   │   └── page.tsx         # Active game session
│   ├── results/
│   │   └── page.tsx         # Session results + share card
│   ├── leaderboard/
│   │   └── page.tsx         # (future) Leaderboard
│   └── api/
│       ├── daily/
│       │   └── route.ts     # GET today's events (no year in response)
│       ├── submit/
│       │   └── route.ts     # POST guess, return score
│       └── results/
│           └── route.ts     # GET user's result for today
├── components/
│   ├── YearSlider.tsx       # Core drag slider component
│   ├── EventCard.tsx        # Displays historical event text
│   ├── ScoreDisplay.tsx     # Per-event score feedback
│   ├── ResultsCard.tsx      # Shareable card with emoji dots
│   ├── StreakBadge.tsx      # Current streak display
│   └── ProgressBar.tsx      # 1-of-5 progress indicator
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client
│   │   └── server.ts        # Server client (RSC/API routes)
│   ├── scoring.ts           # Year-distance scoring logic
│   └── dates.ts             # Daily puzzle date utilities
├── types/
│   └── index.ts             # Shared TypeScript types
└── supabase/
    └── migrations/          # SQL migration files
```

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

## Supabase Setup

- Run migrations in order from `supabase/migrations/`
- Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- RLS policies are required — never expose the service role key client-side

## Key Conventions

- **No year in API responses** — the `events` table has a `year` column; API routes for `GET /api/daily` must strip it before returning to the client
- **Daily puzzle is keyed by UTC date** — use `new Date().toISOString().split('T')[0]` as the date key
- **Scoring**: base max 100 pts per event; exact year earns +10 bonus (110 max); smooth polynomial decay `round(100 × (1 − d/1000)^2.5)`; zeroes at ≥1000 years off; session max 500 base / 550 with all perfects — see `lib/scoring.ts`
- **Streak**: stored in `user_streaks` table; incremented server-side on submission, never client-side
- **Emoji result dots**: green (≥80pts), yellow (≥50pts), orange (≥20pts), red (<20pts)
- **No pre-CE dates**: slider range is always 1 CE – 2025
- **Anonymous play**: Supabase anonymous auth — users get a persistent UUID without signing up; prompt to link account to save streaks long-term
- **Share card**: generated client-side from the ResultsCard component (no server-side image gen needed initially)

## Architecture Notes

- Daily events are seeded manually (or via admin script) into the `events` table, associated with a `daily_puzzle` row keyed by date
- Game state is managed client-side during a session (no mid-game persistence needed initially)
- After all 5 guesses are submitted, the full result is written to `user_results` in one batch POST
- Results are idempotent — re-submitting the same day returns the existing result
- Leaderboard queries should be paginated and cached (use Supabase's built-in caching or Next.js `unstable_cache`)

## Coding Standards

- Prefer server components; use `'use client'` only for interactive UI (slider, share button)
- Co-locate component styles using Tailwind utility classes — no CSS modules
- Keep API route handlers thin; push logic into `lib/`
- TypeScript strict mode — no `any`
- Validate all user input on the server (guess year must be an integer in range)
