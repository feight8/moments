-- =============================================================================
-- 001_initial_schema.sql
-- Core schema for Moments — daily history guessing game
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- events
-- Historical event descriptions. The `year` column is server-side only;
-- it must never be returned by any public API endpoint.
-- ---------------------------------------------------------------------------
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  description text    not null,
  year        integer not null check (year >= 1 and year <= 2025),
  slug        text    not null unique,
  created_at  timestamptz not null default now()
);

comment on column events.year is
  'Correct year — SERVER SIDE ONLY. Never expose via public API.';

-- ---------------------------------------------------------------------------
-- daily_puzzles
-- One row per calendar day. event_ids is an ordered array of 5 event UUIDs.
-- ---------------------------------------------------------------------------
create table if not exists daily_puzzles (
  id         uuid primary key default gen_random_uuid(),
  date       date    not null unique,
  event_ids  uuid[]  not null,
  created_at timestamptz not null default now(),

  constraint daily_puzzles_five_events check (array_length(event_ids, 1) = 5)
);

-- ---------------------------------------------------------------------------
-- user_results
-- One row per user per day. Idempotent via UNIQUE constraint.
-- guesses stores the full scored breakdown.
-- ---------------------------------------------------------------------------
create table if not exists user_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  puzzle_date  date        not null,
  guesses      jsonb       not null default '[]',
  total_score  integer     not null default 0,
  completed_at timestamptz not null default now(),

  unique (user_id, puzzle_date)
);

-- ---------------------------------------------------------------------------
-- user_streaks
-- One row per user; updated on each successful submission.
-- ---------------------------------------------------------------------------
create table if not exists user_streaks (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  current_streak      integer     not null default 0,
  longest_streak      integer     not null default 0,
  last_completed_date date,
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists daily_puzzles_date_idx   on daily_puzzles (date);
create index if not exists user_results_user_idx    on user_results  (user_id);
create index if not exists user_results_date_idx    on user_results  (puzzle_date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table events          enable row level security;
alter table daily_puzzles   enable row level security;
alter table user_results    enable row level security;
alter table user_streaks    enable row level security;

-- events: readable by all authenticated and anonymous users (year stripped in app layer)
create policy "events_public_read"
  on events for select
  using (true);

-- daily_puzzles: readable by all
create policy "daily_puzzles_public_read"
  on daily_puzzles for select
  using (true);

-- user_results: users can only read/write their own rows
create policy "user_results_own_read"
  on user_results for select
  using (auth.uid() = user_id);

create policy "user_results_own_insert"
  on user_results for insert
  with check (auth.uid() = user_id);

-- user_streaks: users can only read/write their own row
create policy "user_streaks_own_read"
  on user_streaks for select
  using (auth.uid() = user_id);

create policy "user_streaks_own_upsert"
  on user_streaks for insert
  with check (auth.uid() = user_id);

create policy "user_streaks_own_update"
  on user_streaks for update
  using (auth.uid() = user_id);
