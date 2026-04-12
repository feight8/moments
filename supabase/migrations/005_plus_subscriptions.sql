-- =============================================================================
-- 005_plus_subscriptions.sql
-- Moments+ subscription tracking and streak shields.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- user_plus: stores subscription status per user
-- ---------------------------------------------------------------------------
create table if not exists user_plus (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  plan                  text not null check (plan in ('monthly', 'lifetime')),
  status                text not null check (status in ('active', 'cancelled', 'expired')),
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  -- Null for lifetime plans; set by Stripe for monthly plans.
  current_period_end    timestamptz,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- RLS: users can read their own Plus status only.
alter table user_plus enable row level security;

create policy "users_read_own_plus"
  on user_plus for select
  using (auth.uid() = user_id);

-- Service role can write (Stripe webhook handler uses service client).

-- ---------------------------------------------------------------------------
-- streak_shields: one free-miss allowance per calendar month for Plus users
-- ---------------------------------------------------------------------------
create table if not exists streak_shields (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  month_key        text not null,    -- YYYY-MM; resets each month
  shields_remaining int not null default 1 check (shields_remaining >= 0),
  updated_at       timestamptz default now()
);

alter table streak_shields enable row level security;

create policy "users_read_own_shields"
  on streak_shields for select
  using (auth.uid() = user_id);
