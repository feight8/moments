# CLAUDE.md — Circa Project

## Project Overview

**Circa** is a daily history guessing game at [circagame.com](https://circagame.com). Each day, users read 2–3 sentence descriptions of 5 historical events (year omitted) and drag a slider to guess the year. They're scored by proximity to the correct year, can build streaks, join friend groups, and subscribe to **Circa+** for archive access, streak shields, and group play.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Payments**: Stripe (monthly + annual subscriptions)
- **Deployment**: Vercel

## Project Structure

```
circa/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Home — daily CTA + category section + Plus teaser
│   ├── play/page.tsx                   # Active game session (?date=, ?category=)
│   ├── results/page.tsx                # Session results + share card + groups
│   ├── stats/page.tsx                  # Personal stats
│   ├── archive/page.tsx                # Past puzzles (Plus only)
│   ├── account/page.tsx                # Sign in, create account, password reset, subscription
│   ├── login/page.tsx                  # Standalone sign-in page
│   ├── help/page.tsx                   # FAQ + how to play
│   ├── plus/page.tsx                   # Circa+ pricing and features
│   ├── plus/success/page.tsx           # Post-checkout confirmation
│   ├── groups/page.tsx                 # My groups list + create group
│   ├── groups/[id]/page.tsx            # Group leaderboard for today
│   ├── groups/join/page.tsx            # Join a group via invite code
│   ├── auth/callback/route.ts          # PKCE + token-hash auth callback (password reset, OAuth)
│   └── api/
│       ├── daily/route.ts              # GET today's puzzle (strips year from response)
│       ├── guess/route.ts              # POST single guess → score
│       ├── submit/route.ts             # POST full session → persist result + update streak
│       ├── results/route.ts            # GET completed session result
│       ├── stats/route.ts              # GET personal stats
│       ├── distribution/route.ts       # GET score distribution for a date
│       ├── streak/route.ts             # GET current streak
│       ├── archive/route.ts            # POST archive puzzle access (Plus gate)
│       ├── groups/route.ts             # GET my groups / POST create group
│       ├── groups/[id]/route.ts        # GET / PUT / DELETE a group
│       ├── groups/[id]/scores/route.ts # GET group leaderboard for today
│       ├── groups/[id]/members/[userId]/route.ts
│       ├── groups/join/route.ts        # POST join group by invite code
│       ├── plus/status/route.ts        # GET Plus status + isAdmin + categoriesEnabled
│       ├── plus/verify-checkout/route.ts
│       ├── stripe/checkout/route.ts    # POST create Stripe checkout session
│       ├── stripe/portal/route.ts      # POST open Stripe billing portal
│       └── stripe/webhook/route.ts     # POST Stripe webhook (provision / cancel Plus)
├── components/
│   ├── CircaLogo.tsx
│   ├── NavHeader.tsx
│   ├── ProgressBar.tsx
│   ├── YearSlider.tsx                  # Core drag slider
│   ├── EventCard.tsx                   # Historical event description card
│   ├── RevealCard.tsx                  # Post-guess reveal with correct year + context
│   ├── ScoreDisplay.tsx                # Per-event score feedback
│   ├── ScoreDistribution.tsx           # Bell-curve distribution chart
│   ├── ResultsCard.tsx                 # Shareable results with dig-tier emojis + groups
│   ├── TimelineReveal.tsx              # Animated timeline after reveal
│   ├── CategorySection.tsx             # Admin/flag-gated category puzzle links on home
│   ├── LinkAccountPrompt.tsx           # CTA to link anonymous session to an account
│   ├── PlusBadge.tsx                   # Circa+ badge
│   ├── PlusGate.tsx                    # Wrapper that gates content to Plus users
│   ├── StreakBadge.tsx                 # Current streak display
│   └── SettingsProvider.tsx            # Client-side theme/settings context
├── lib/
│   ├── scoring.ts                      # Scoring logic (see Key Conventions below)
│   ├── plus.ts                         # isAdminUser, isCategoriesEnabled, getUserPlusStatus, upsertPlusRecord, consumeStreakShield
│   ├── puzzle.ts                       # resolveActivePuzzleDate (category-aware)
│   ├── dates.ts                        # todayDate, formatPuzzleDate helpers
│   ├── settings.ts                     # Client-side settings/theme hook
│   ├── sounds.ts                       # Sound effect helpers (lock-in, reveal)
│   └── supabase/
│       ├── client.ts                   # createBrowserClient (anon key, PKCE)
│       ├── server.ts                   # createServerClient + createServiceClient
│       └── auth.ts                     # Auth utility helpers
├── types/index.ts                      # All shared TypeScript types
├── tests/
│   ├── smoke/app-loads.spec.ts         # Homepage + play page + API smoke tests
│   ├── scoring.spec.ts
│   ├── slider.spec.ts
│   ├── api-submit.spec.ts
│   ├── results-dots.spec.ts
│   └── setup/auth.setup.ts             # Shared anonymous Supabase session for tests
├── playwright.config.ts
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql
        ├── 002_seed_sample_events.sql
        ├── 003_add_event_details.sql
        ├── 004_fix_image_urls.sql
        ├── 005_plus_subscriptions.sql
        ├── 006_annual_plan.sql
        ├── 007_groups.sql
        └── 009_categories.sql
```

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npx playwright test tests/smoke/   # Smoke tests (requires dev server or auto-starts it)
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Comma-separated Supabase UUIDs with admin access
PLUS_ADMIN_USER_IDS=

# Set to true to enable category puzzles for all users (default: admin-only)
CATEGORIES_ENABLED=false
```

## Key Conventions

### No year in API responses
The `events` table has a `year` column. `GET /api/daily` and `GET /api/guess` must never return `year` to the client — it's stripped server-side.

### Daily puzzle keyed by UTC date
`new Date().toISOString().split('T')[0]` is the canonical date key. Categories add a second dimension — a row is uniquely identified by `(date, category)` where `category IS NULL` means the main daily.

### Scoring
- Slider range: **1000 CE – 2025**
- Base max: **100 pts** per event; exact hit earns **+10 bonus** (110 max per event; 550 max session)
- Formula: `round(100 × (1 − distance/maxDistance)^2.0)`
- Zero-score threshold scales with era (ancient events get more leniency):

  | Era | Max distance before 0 |
  |-----|----------------------|
  | 1900 – present | 150 years |
  | 1700 – 1899 | 200 years |
  | 1500 – 1699 | 275 years |
  | 1200 – 1499 | 375 years |
  | 1000 – 1199 | 475 years |

### Dig-tier result icons
Results use an archaeological dig metaphor — not color dots:

| Tier | Emoji | Threshold |
|------|-------|-----------|
| gem | 💎 | 110 (perfect) |
| artifact | 🏺 | ≥ 85 |
| coin | 🪙 | ≥ 65 |
| fossil | 🦴 | ≥ 20 |
| rock | 🪨 | < 20 |

### Streak
Stored in `user_streaks` table; incremented server-side in `POST /api/submit` for **main daily puzzle only** — category puzzle completions do not affect the streak.

### Anonymous play
Supabase anonymous auth — users get a persistent UUID without signing up. Prompt to link an email account to preserve streaks long-term (`LinkAccountPrompt` component).

### Circa+
Gated features: archive, streak shields (1/month), group leaderboards. Provisioned via Stripe webhook → `upsertPlusRecord` → `user_plus` table. Admin users (in `PLUS_ADMIN_USER_IDS`) bypass the Plus check entirely.

### Category puzzles
Accessible at `/play?category=sports` etc. Admin-only by default; set `CATEGORIES_ENABLED=true` to open to all users. The `CategorySection` component on the homepage fetches `/api/plus/status` and renders only when `isAdmin || categoriesEnabled`.

### Auth callback
`/auth/callback` handles both PKCE code exchange (`?code=`) and token-hash verification (`?token_hash=&type=`). Password reset emails are configured in the Supabase email template to link to `https://circagame.com/auth/callback?token_hash={{ .TokenHash }}&type=recovery`.

## Coding Standards

- Prefer server components; use `'use client'` only for interactive UI
- Co-locate styles with Tailwind utility classes — no CSS modules
- Keep API route handlers thin; push logic into `lib/`
- TypeScript strict mode — no `any`
- Validate all user input on the server
