-- Migration 009: Categories support
-- Adds an optional category column to daily_puzzles and user_results so
-- multiple themed puzzles can coexist on the same date (NULL = main daily).

-- -----------------------------------------------------------------------
-- daily_puzzles
-- -----------------------------------------------------------------------

ALTER TABLE daily_puzzles
  ADD COLUMN category TEXT DEFAULT NULL;

-- Drop the simple UNIQUE(date) constraint; replace with partial indexes so
-- Postgres correctly enforces uniqueness per (date, NULL) and per (date, category).
ALTER TABLE daily_puzzles
  DROP CONSTRAINT IF EXISTS daily_puzzles_date_key;

-- One main puzzle per date (category IS NULL)
CREATE UNIQUE INDEX daily_puzzles_date_main
  ON daily_puzzles (date)
  WHERE category IS NULL;

-- One puzzle per (date, category) for each named category
CREATE UNIQUE INDEX daily_puzzles_date_category
  ON daily_puzzles (date, category)
  WHERE category IS NOT NULL;

-- -----------------------------------------------------------------------
-- user_results
-- -----------------------------------------------------------------------

ALTER TABLE user_results
  ADD COLUMN category TEXT DEFAULT NULL;

-- Drop the existing uniqueness constraint
ALTER TABLE user_results
  DROP CONSTRAINT IF EXISTS user_results_user_id_puzzle_date_key;

-- One main result per (user, date)
CREATE UNIQUE INDEX user_results_user_date_main
  ON user_results (user_id, puzzle_date)
  WHERE category IS NULL;

-- One category result per (user, date, category)
CREATE UNIQUE INDEX user_results_user_date_category
  ON user_results (user_id, puzzle_date, category)
  WHERE category IS NOT NULL;
