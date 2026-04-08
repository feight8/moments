-- =============================================================================
-- 002_seed_sample_events.sql
-- Sample events for development / testing.
-- Replace with real curated content before launch.
-- =============================================================================

insert into events (id, description, year, slug) values
  (
    'a1000000-0000-0000-0000-000000000001',
    'A merchant from the Republic of Genoa completed a westward ocean voyage, making landfall in the Caribbean after more than two months at sea. His expedition was funded by the Spanish Crown and he believed he had reached Asia. The contact he initiated would permanently alter the course of human history.',
    1492,
    'columbus-reaches-caribbean'
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'A young German engineer and his business partner successfully flew a powered, heavier-than-air aircraft for twelve seconds at a beach in North Carolina. They made four flights that morning, the longest lasting 59 seconds. No one from the press was present to witness it.',
    1903,
    'wright-brothers-first-flight'
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'An Austrian archduke and his wife were assassinated by a Bosnian nationalist while riding through a city in an open car. The killer had earlier failed with a bomb and only succeeded after the archduke''s driver took a wrong turn. The event set off a chain of alliances that plunged Europe into war.',
    1914,
    'assassination-of-franz-ferdinand'
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'A human being set foot on a celestial body other than Earth for the first time. The mission required a journey of nearly 240,000 miles and the landing craft touched down with less than 30 seconds of fuel remaining. Roughly 600 million people watched on television.',
    1969,
    'moon-landing'
  ),
  (
    'a1000000-0000-0000-0000-000000000005',
    'A 29-year-old British scientist published a paper describing the structure of a molecule that carries genetic instructions in all living organisms. The model, based partly on X-ray diffraction images taken by a colleague, was described as a double helix. It would reshape biology forever.',
    1953,
    'watson-crick-dna-structure'
  ),
  (
    'a1000000-0000-0000-0000-000000000006',
    'A heavily fortified wall that had divided a major European city for nearly three decades began to be demolished as jubilant crowds celebrated on both sides. The government of the eastern country had announced the border would open, and citizens began physically dismantling the structure overnight. It marked the symbolic end of the Cold War.',
    1989,
    'berlin-wall-falls'
  ),
  (
    'a1000000-0000-0000-0000-000000000007',
    'A Florentine artist completed one of the most recognizable portraits in the world, depicting a woman with a famously ambiguous expression against a misty landscape. The identity of the subject has been debated by art historians for centuries. It now hangs behind bulletproof glass in a Paris museum.',
    1503,
    'mona-lisa-completed'
  ),
  (
    'a1000000-0000-0000-0000-000000000008',
    'A German physicist published three landmark papers in a single year, introducing the special theory of relativity, the photoelectric effect, and Brownian motion. He was an unknown patent clerk at the time. One of the papers would later earn him the Nobel Prize.',
    1905,
    'einstein-annus-mirabilis'
  ),
  (
    'a1000000-0000-0000-0000-000000000009',
    'An English scientist presented a theory proposing that species change over time through a process of natural selection acting on heritable variation. He had delayed publishing for nearly two decades, and was finally prompted by a letter from a fellow naturalist who had independently reached the same conclusions. The book sold out on its first day.',
    1859,
    'darwin-origin-of-species'
  ),
  (
    'a1000000-0000-0000-0000-000000000010',
    'A massive volcanic eruption on an Indonesian island killed an estimated 36,000 people, mostly from the resulting tsunamis. The explosion was heard nearly 3,000 miles away in Australia. Ash in the atmosphere caused vivid sunsets across the world for months afterward.',
    1883,
    'krakatoa-eruption'
  );

-- ---------------------------------------------------------------------------
-- Sample daily puzzle for today (used in development)
-- Replace CURRENT_DATE with a specific date for production seeding
-- ---------------------------------------------------------------------------
insert into daily_puzzles (date, event_ids) values
  (
    current_date,
    array[
      'a1000000-0000-0000-0000-000000000001'::uuid,
      'a1000000-0000-0000-0000-000000000002'::uuid,
      'a1000000-0000-0000-0000-000000000003'::uuid,
      'a1000000-0000-0000-0000-000000000004'::uuid,
      'a1000000-0000-0000-0000-000000000005'::uuid
    ]
  )
on conflict (date) do nothing;
