-- =============================================================================
-- 003_add_event_details.sql
-- Adds image and contextual fields to the events table
-- =============================================================================

alter table events
  add column if not exists image_url          text,
  add column if not exists reveal_image_url   text,
  add column if not exists additional_context text;

comment on column events.image_url is
  'Image shown alongside the event description while the user is guessing.';
comment on column events.reveal_image_url is
  'Second image shown after the user submits their guess, with the reveal.';
comment on column events.additional_context is
  'Extra detail about the event shown after the user guesses — historical context, significance, etc.';

-- ---------------------------------------------------------------------------
-- Update seed events with images and additional context
-- All images sourced from Wikimedia Commons (public domain / CC).
-- URLs use Special:FilePath redirects — these resolve correctly regardless of
-- internal Wikimedia hashes and are stable even if files are moved.
-- ---------------------------------------------------------------------------

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Christopher_Columbus.PNG?width=600',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Landing_of_Columbus_(2).jpg?width=800',
  additional_context = 'Columbus made four voyages to the Americas but died believing he had reached Asia. The expedition was financed after years of rejections from the Portuguese court, and Columbus himself called the indigenous people he encountered "Indians." It would be another decade before European cartographers began to understand the true scale of what had been found.'
where slug = 'columbus-reaches-caribbean';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/First_flight2.jpg?width=800',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Wright_first_flight.jpg?width=800',
  additional_context = 'The Wright Brothers made four flights that morning at Kitty Hawk, North Carolina. The aircraft, named the Flyer, was constructed from spruce wood, muslin fabric, and a gasoline engine the brothers built themselves. Orville piloted the historic first flight; Wilbur watched from the ground. A telegram to their father that day read simply: "Success."'
where slug = 'wright-brothers-first-flight';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Archduke_Franz_Ferdinand_of_Austria.jpg?width=600',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Assassination_of_Archduke_Franz_Ferdinand_of_Austria.jpg?width=800',
  additional_context = 'The assassination was carried out by Gavrilo Princip, a 19-year-old Bosnian Serb nationalist. Six conspirators had been stationed along the archduke''s route earlier that morning, but the first bomb attempt failed. Princip encountered the archduke''s car by chance after it took a wrong turn — one of history''s most consequential accidents. Austria-Hungary''s ultimatum to Serbia a month later triggered a cascade of mobilizations across Europe.'
where slug = 'assassination-of-franz-ferdinand';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Aldrin_Apollo_11_original.jpg?width=600',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Aldrin_Apollo_11_original.jpg?width=900',
  additional_context = 'Neil Armstrong and Buzz Aldrin spent two and a half hours on the lunar surface, collecting 47.5 pounds of rock and soil samples. Michael Collins orbited above in the command module. The mission used 400,000 engineers, scientists, and technicians across thousands of companies. The guidance computer that landed them had less processing power than a modern pocket calculator.'
where slug = 'moon-landing';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Photo_51_x-ray_diffraction_image.jpg?width=600',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Crick_Watson_DNA_model.jpg?width=800',
  additional_context = 'The paper was just 900 words long. Watson and Crick relied heavily on X-ray diffraction data produced by Rosalind Franklin — data they accessed without her knowledge. Franklin''s contribution went largely uncredited for decades. The Nobel Prize for the discovery was awarded in 1962 to Watson, Crick, and Maurice Wilkins; Franklin had died of cancer in 1958 and the prize is not awarded posthumously.'
where slug = 'watson-crick-dna-structure';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Falling_of_the_Berlin_Wall_1989.jpg?width=800',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Bundesarchiv_Bild_183-1989-1110-005,_Berliner_Mauer,_Umgebung_Brandenburger_Tor.jpg?width=800',
  additional_context = 'The announcement to open the borders was made at a press conference by East German spokesman Günter Schabowski — who had not been properly briefed and believed it was effective immediately. Within hours, crowds gathered at checkpoints and overwhelmed guards simply let people through. The reunification of East and West Germany followed less than a year later, on October 3, 1990.'
where slug = 'berlin-wall-falls';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg?width=500',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg?width=800',
  additional_context = 'The identity of the subject is most likely Lisa Gherardini, wife of a Florentine merchant named Francesco del Giocondo — hence the Italian name "La Gioconda." Leonardo worked on the painting for four years and kept it until his death rather than delivering it to the patron. It was stolen from the Louvre in 1911 and recovered two years later after a tip-off from an Italian antique dealer.'
where slug = 'mona-lisa-completed';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Albert_Einstein_Head.jpg?width=600',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Einstein_1921_by_F_Schmutzer_-_restoration.jpg?width=800',
  additional_context = 'Einstein wrote all three papers while working as a technical examiner at the Swiss Patent Office in Bern, in his spare time. He had a PhD but had failed to secure an academic position. His paper on the photoelectric effect — not relativity — is what won him the Nobel Prize in 1921. Relativity was considered too controversial by the committee at the time.'
where slug = 'einstein-annus-mirabilis';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Charles_Darwin_seated_crop.jpg?width=600',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/On_the_Origin_of_Species_title_page.jpg?width=800',
  additional_context = 'Darwin had gathered his evidence during the HMS Beagle voyage of 1831–1836 but spent over two decades refining his theory before publishing. The competing naturalist who forced his hand, Alfred Russel Wallace, had independently developed the same theory while suffering from malaria in Southeast Asia. Both men are credited with co-discovering natural selection, though Darwin''s book became the definitive statement of the theory.'
where slug = 'darwin-origin-of-species';

update events set
  image_url        = 'https://commons.wikimedia.org/wiki/Special:FilePath/Krakatoa_eruption_lithograph.jpg?width=800',
  reveal_image_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/Krakatoa_eruption_lithograph.jpg?width=1000',
  additional_context = 'The Krakatoa explosion generated the loudest sound ever recorded in human history — heard as far away as Rodriguez Island, nearly 3,000 miles away. The eruption ejected approximately 21 cubic kilometers of ash and rock into the atmosphere. The resulting dust cloud lowered global temperatures by 1.2°C for five years. Vivid red sunsets inspired by the atmospheric ash are thought to have influenced Edvard Munch when he painted "The Scream" a decade later.'
where slug = 'krakatoa-eruption';
