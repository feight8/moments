-- =============================================================================
-- 004_fix_image_urls.sql
-- Replaces the 7 Wikimedia image URLs that were returning 404.
-- All replacement filenames verified against Special:FilePath on 2026-04-12.
-- =============================================================================

-- Wright Brothers: reveal was 404 (Wright_first_flight.jpg doesn't exist)
-- Replacement: a second photo from the same morning at Kitty Hawk
update events set
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/First_flight3.jpg?width=800'
where slug = 'wright-brothers-first-flight';

-- Franz Ferdinand: reveal was 404 (Assassination_of_Archduke_Franz_Ferdinand_of_Austria.jpg)
-- Replacement: 1914 Sarajevo assassination map showing the route and ambush points
update events set
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/1914_Sarajevo_assassination_map.jpg?width=800'
where slug = 'assassination-of-franz-ferdinand';

-- DNA: both main and reveal were 404
-- Main: Photo 51 (Rosalind Franklin's X-ray diffraction image)
-- Reveal: Watson and Crick with their double-helix model
update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/60251254_photo-51-print-qp867-a4_2.jpg?width=600',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/DNA_Model_Crick-Watson.jpg?width=800'
where slug = 'watson-crick-dna-structure';

-- Berlin Wall: both main and reveal were 404
-- Main: crowds at the wall with Brandenburg Gate visible
-- Reveal: West and East Germans reuniting at the Brandenburg Gate
update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/BerlinWall-BrandenburgGate.jpg?width=800',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/West_and_East_Germans_at_the_Brandenburg_Gate_in_1989.jpg?width=800'
where slug = 'berlin-wall-falls';

-- Darwin: reveal was 404 (On_the_Origin_of_Species_title_page.jpg)
-- Replacement: Wellcome Library scan of the original title page
update events set
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Charles_Darwin,_The_origin_of_species_Wellcome_L0029117.jpg?width=800'
where slug = 'darwin-origin-of-species';
