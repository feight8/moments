-- =============================================================================
-- 006_annual_plan.sql
-- Rename plan value 'lifetime' → 'annual' and add annual to the check constraint.
-- =============================================================================

-- Drop old check constraint and add the updated one
alter table user_plus drop constraint if exists user_plus_plan_check;
alter table user_plus add constraint user_plus_plan_check check (plan in ('monthly', 'annual'));

-- Migrate any existing lifetime rows to annual
update user_plus set plan = 'annual' where plan = 'lifetime';

-- Remove the comment referencing lifetime
comment on column user_plus.current_period_end is
  'Null only if not yet set by Stripe; populated on subscription.updated webhook.';
