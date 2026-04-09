# Requirements — Moments

## 1. Functional Requirements

### 1.1 Daily Puzzle

- FR-01: Each calendar day has exactly one puzzle set, consisting of exactly 5 historical events.
- FR-02: All users playing on the same day see the same 5 events in the same order.
- FR-03: Event descriptions are 2–3 sentences long and must not mention the year or a date precise enough to unambiguously identify the year.
- FR-04: Each event has a single canonical correct year (integer, 1–2025).
- FR-05: Puzzles must be seeded in advance; the system must not auto-generate events.
- FR-06: After a user completes today's puzzle, they cannot replay it on the same day.

### 1.2 Gameplay

- FR-07: Users are presented one event at a time, in order.
- FR-08: For each event, the user drags (or uses keyboard arrows) to pick a year on a slider.
- FR-09: The slider range is configurable per-puzzle but defaults to 1 CE – 2025.
- FR-10: After submitting a guess, the user sees the correct year, their guess, and their score for that event before proceeding.
- FR-11: Game state is maintained client-side during a session; no mid-game server persistence is required.
- FR-12: All 5 guesses are submitted to the server in a single batch at the end of the session.

### 1.3 Scoring

- FR-13: Base maximum score per event is 100 points. A perfect guess (exact year) earns a +10 bonus, giving a per-event maximum of 110 points.
- FR-14: Score degrades continuously using a polynomial decay curve based on absolute year distance. There are no score cliffs — every year closer to the correct answer is worth more.
- FR-15: Total session score is the sum of scores for all 5 events. Base max is 500; maximum with all 5 perfect bonuses is 550.
- FR-16: Score is calculated server-side; client-side preview is for UX only and must be confirmed by server.

**Scoring formula** (`lib/scoring.ts`):
```
distance = |guess_year − correct_year|
if distance == 0   → 110  (100 base + 10 perfect bonus)
if distance ≥ 250  → 0
otherwise          → round(100 × (1 − distance / 250) ^ 2.0)
```

**Sample scores:**

| Distance (years) | Points |
|-----------------|--------|
| 0 (exact) | 110 (includes +10 bonus) |
| 10 | ~92 |
| 25 | ~81 |
| 50 | ~64 |
| 100 | ~36 |
| 150 | ~16 |
| 200 | ~4 |
| ≥ 250 | 0 |

**Design notes:**
- The curve is intentionally generous at close distances to reward players who are nearly right, and to encourage continued play rather than early discouragement.
- Era-adjusted scoring (scaling difficulty by historical period) is deferred to Phase 3.
- The slider range is 1 CE – 2025; no pre-CE (BCE) dates are used.

### 1.4 Results & Sharing

- FR-17: After completing all 5 events, users see a results screen showing: each event's correct year, their guess, points earned, and total score.
- FR-18: Each event is represented by a colored emoji dot based on score:
  - Green (🟢): ≥ 80 points (includes all perfect +110 scores)
  - Yellow (🟡): ≥ 50 points
  - Orange (🟠): ≥ 20 points
  - Red (🔴): < 20 points
- FR-19: A "Copy Results" button copies a formatted text block to the clipboard.
- FR-20: The shareable text includes: app name, date, emoji dot row, total score, and current streak.
- FR-21: Results are persisted server-side so users can return to view their result for today.

### 1.5 Streak System

- FR-22: A streak is the count of consecutive calendar days on which the user completed the puzzle.
- FR-23: Streaks are per-user and stored server-side.
- FR-24: If a user misses a day, their streak resets to 0 (not 1) on their next completion.
- FR-25: Streak is displayed on the results screen and in the share card.
- FR-26: Streak increment is performed server-side only, on result submission.

### 1.6 User Identity

- FR-27: Users can play without creating an account (anonymous Supabase auth).
- FR-28: Anonymous users receive a persistent UUID stored in a cookie/localStorage.
- FR-29: Users may optionally sign in with email/OAuth to link their anonymous session to a named account.
- FR-30: Streak and results carry over when an anonymous account is linked to a named account.

### 1.7 Leaderboard (Phase 2)

- FR-31: A daily leaderboard ranks users by total session score for that day.
- FR-32: An all-time leaderboard ranks users by cumulative score across all sessions.
- FR-33: Leaderboard entries show display name, score, and streak.
- FR-34: Only named (non-anonymous) accounts appear on public leaderboards.

---

## 2. Non-Functional Requirements

- NFR-01: Page load (puzzle page) must be under 2s on a 4G connection.
- NFR-02: The year in event data must never be returned by any public API endpoint.
- NFR-03: All user input (guess year) must be validated server-side (integer, within slider range).
- NFR-04: Result submission must be idempotent — re-submitting the same day returns the existing result without overwriting.
- NFR-05: The app must be usable on mobile (responsive, touch-friendly slider).
- NFR-06: Supabase RLS policies must be in place; the service role key must never be exposed client-side.

---

## 3. Database Schema

### `events`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| description | text | 2–3 sentence event description, no year |
| year | integer | Correct year (server-side only) |
| slug | text | Human-readable identifier |
| created_at | timestamptz | |

### `daily_puzzles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| date | date UNIQUE | UTC date of the puzzle (YYYY-MM-DD) |
| event_ids | uuid[] | Ordered array of 5 event UUIDs |
| created_at | timestamptz | |

### `user_results`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| puzzle_date | date | |
| guesses | jsonb | Array of {event_id, guess_year, score} |
| total_score | integer | |
| completed_at | timestamptz | |
| UNIQUE (user_id, puzzle_date) | | Enforces idempotency |

### `user_streaks`
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid PK FK → auth.users | |
| current_streak | integer | |
| longest_streak | integer | |
| last_completed_date | date | |
| updated_at | timestamptz | |

---

## 4. API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/daily | anon | Returns today's puzzle events (no year field) |
| POST | /api/submit | anon | Submits 5 guesses, returns scored result |
| GET | /api/results | anon | Returns the current user's result for today |
| GET | /api/streak | anon | Returns the current user's streak |
| GET | /api/leaderboard | anon | (Phase 2) Daily + all-time leaderboard |

---

## 5. Phased Delivery

### Phase 1 — Core Game (MVP)
- Next.js project scaffold with App Router
- Supabase schema + RLS policies
- Daily puzzle API (no year in response)
- Year slider component (drag + keyboard)
- Event card component
- Client-side game session state
- Server-side scoring on submit
- Results screen with emoji dots
- Clipboard share card
- Streak system
- Anonymous auth via Supabase

### Phase 2 — Social & Leaderboard
- Named account creation (email + OAuth)
- Anonymous → named account linking
- Daily leaderboard
- All-time leaderboard
- Admin UI for seeding events

### Phase 3 — Polish & Growth
- Animated slider feedback
- Sound effects (optional / toggleable)
- Push notifications for daily reminder (PWA)
- Historical context shown after guessing (Wikipedia snippet or custom blurb)
- Difficulty tiers (narrow slider range vs. full history)

---

## 6. Open Questions

- OQ-01: Should the slider be linear (1–2025) or logarithmic (to give more resolution to recent history)?
- OQ-02: How many events should be seeded at launch? Target: at least 90 days of puzzles pre-loaded.
- OQ-03: Should users be allowed to view past puzzle results? If so, is replaying past puzzles allowed?
- OQ-04: What is the tie-breaking rule for the leaderboard when scores are equal?
- OQ-05: Is there a per-event time limit, or is the game untimed?

**Resolved:**
- OQ-06: Pre-CE (BCE) dates — resolved as out of scope. Slider range is 1 CE – 2025 only.
- OQ-07: Perfect guess bonus — resolved as +10 points on top of the 100-point base.
- OQ-09: Era-adjustment visibility — resolved as deferred to Phase 3; not included in MVP.
