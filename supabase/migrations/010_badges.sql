-- =============================================================================
-- 010_badges.sql
-- Badges & achievements system for Circa
-- All badge thresholds are real historical metrics (height, year, distance, etc.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS badges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text    NOT NULL,
  description     text    NOT NULL,
  emoji           text    NOT NULL,
  condition_type  text    NOT NULL,
  condition_value integer,
  condition_meta  jsonb,
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id   uuid NOT NULL REFERENCES badges(id)     ON DELETE CASCADE,
  earned_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS user_badges_user_idx    ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS user_badges_earned_idx  ON user_badges (user_id, earned_at DESC);

ALTER TABLE badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_public_read"
  ON badges FOR SELECT USING (true);

CREATE POLICY "user_badges_own_read"
  ON user_badges FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_badges_own_insert"
  ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed: initial badge catalog
-- condition_type values:
--   total_score      — lifetime main-daily score >= condition_value
--   streak_days      — current streak >= condition_value
--   total_games      — total main-daily games played >= condition_value
--   perfect_games    — lifetime games with total_score = 550 >= condition_value
--   hat_trick        — isPerfect events in one game >= condition_value
--   dead_reckoning   — totalScore >= condition_value AND no isPerfect events
--   category_played  — played category in condition_meta->>'category'
--   completionist    — played all active categories on same day
--   group_joined     — member of at least one group
-- ---------------------------------------------------------------------------

INSERT INTO badges (name, description, emoji, condition_type, condition_value, condition_meta, sort_order) VALUES

-- -----------------------------------------------------------------------
-- Lifetime score milestones (historical years, heights, distances)
-- -----------------------------------------------------------------------
('Olympian',    '776 BCE: the year of the very first Olympic Games',                        '🏛️', 'total_score', 776,    NULL, 10),
('Joan of Arc', '1429: the year she led France to victory at Orléans',                      '⚔️', 'total_score', 1429,   NULL, 20),
('Tea Party',   '1773: the year of the Boston Tea Party',                                   '🍵', 'total_score', 1773,   NULL, 30),
('Fuji',        '3,776 meters: the height of Mt. Fuji',                                     '🗻', 'total_score', 3776,   NULL, 40),
('Kilimanjaro', '5,895 meters: the height of Mt. Kilimanjaro',                              '🏔️', 'total_score', 5895,   NULL, 50),
('Everest',     '8,848 meters: the height of Mt. Everest',                                  '⛰️', 'total_score', 8848,   NULL, 60),
('Great Wall',  '13,171 miles: the total length of the Great Wall of China',                '🧱', 'total_score', 13171,  NULL, 70),
('Magellan',    '37,560 miles: the estimated distance of Magellan''s circumnavigation',     '🌊', 'total_score', 37560,  NULL, 80),
('Armstrong',   '238,900 miles: the distance from Earth to the Moon',                       '🚀', 'total_score', 238900, NULL, 90),

-- -----------------------------------------------------------------------
-- Streak milestones (historical durations)
-- -----------------------------------------------------------------------
('Apollo',    '8 days: the duration of the Apollo 11 mission (July 16–24, 1969)',           '🌕', 'streak_days', 8,   NULL, 110),
('Olympus',   '12 days: one for each of the 12 Olympian gods',                              '⚡', 'streak_days', 12,  NULL, 120),
('Marathon',  '26 days: the 26.2-mile distance of the marathon race',                       '🏃', 'streak_days', 26,  NULL, 130),
('Barton',    '60 days: Clara Barton''s age when she founded the American Red Cross',       '🏥', 'streak_days', 60,  NULL, 140),
('Fogg',      '80 days: Phileas Fogg''s journey Around the World (Jules Verne, 1873)',      '🌍', 'streak_days', 80,  NULL, 150),
('Napoleon',  '100 days: Napoleon''s Hundred Days before the Battle of Waterloo',           '👑', 'streak_days', 100, NULL, 160),
('Copernicus','365 days: one full revolution of the Earth around the Sun',                   '🌞', 'streak_days', 365, NULL, 170),

-- -----------------------------------------------------------------------
-- Games played milestones
-- -----------------------------------------------------------------------
('First Step',    'Your very first game: every great expedition starts with one step',      '👣', 'total_games', 1,   NULL, 210),
('Seven Wonders', '7 games: one for each Wonder of the Ancient World',                      '🏺', 'total_games', 7,   NULL, 220),
('Forty Thieves', '40 games: Ali Baba and the Forty Thieves',                               '🏺', 'total_games', 40,  NULL, 230),
('Curie',         '88 games: Radium is element 88, discovered by Marie Curie',              '⚗️', 'total_games', 88,  NULL, 240),
('Centurion',     '100 games: a Roman centurion commanded exactly 100 soldiers',            '🛡️', 'total_games', 100, NULL, 250),
('Spartan',       '300 games: 300 Spartans held the pass at Thermopylae',                   '⚔️', 'total_games', 300, NULL, 260),

-- -----------------------------------------------------------------------
-- Skill / one-off achievements
-- -----------------------------------------------------------------------
('Perfect Dig',   'A flawless 550/500 session: a perfect archaeological excavation',        '💎', 'perfect_games',  1,   NULL, 310),
('Schliemann',    '10 perfect games: obsessive precision, like the excavator of Troy',      '🏛️', 'perfect_games',  10,  NULL, 320),
('Hat Trick',     '3 exact year guesses in one game: a term coined in 1858 cricket',        '🎩', 'hat_trick',      3,   NULL, 330),
('Dead Reckoning','Score 450+ with zero exact guesses: navigate by calculation alone',      '🧭', 'dead_reckoning', 450, NULL, 340),

-- -----------------------------------------------------------------------
-- Category & social
-- -----------------------------------------------------------------------
('Owens',    'Played a sports puzzle: Jesse Owens won 4 golds at the 1936 Berlin Olympics', '🏅', 'category_played', NULL, '{"category":"sports"}',      410),
('Warhol',   'Played a pop culture puzzle: Warhol turned pop culture into history',          '🎨', 'category_played', NULL, '{"category":"pop-culture"}', 420),
('Da Vinci', 'Played all active categories in one day: mastery across every discipline',     '🖌️', 'completionist',   NULL, NULL,                         430),
('Senate',   'Joined a group: the Roman Senate, the original assembly of citizens',          '🏛️', 'group_joined',    NULL, NULL,                         440);
