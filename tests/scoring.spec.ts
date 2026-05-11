// @covers: lib/scoring.ts
// @routes: (none — pure unit tests, no browser required)
// @feature: scoring

import { test, expect } from '@playwright/test';
import {
  scoreGuess,
  scoreToDot,
  buildEmojiRow,
  getEraMaxDistance,
  YEAR_MIN,
  YEAR_MAX,
  DOT_EMOJI,
} from '../lib/scoring';

// Expected values are derived from the actual implementation:
//   score = round(BASE_MAX × (1 − distance/maxDistance)^EXPONENT)
// where EXPONENT=2.0 and maxDistance is era-dependent (see getEraMaxDistance).
// The CLAUDE.md spec describes a fixed 1000-year threshold and exponent 2.5 —
// the actual code differs; these tests reflect the code.

test.describe('constants', () => {
  test('YEAR_MIN is 1000', () => expect(YEAR_MIN).toBe(1000));
  test('YEAR_MAX is 2025', () => expect(YEAR_MAX).toBe(2025));
});

test.describe('getEraMaxDistance', () => {
  test('modern events (≥1900) → 150-year leniency', () => {
    expect(getEraMaxDistance(2000)).toBe(150);
    expect(getEraMaxDistance(1900)).toBe(150);
  });

  test('early modern events (1700–1899) → 200-year leniency', () => {
    expect(getEraMaxDistance(1800)).toBe(200);
    expect(getEraMaxDistance(1700)).toBe(200);
  });

  test('Renaissance events (1500–1699) → 275-year leniency', () => {
    expect(getEraMaxDistance(1600)).toBe(275);
    expect(getEraMaxDistance(1500)).toBe(275);
  });

  test('late medieval events (1200–1499) → 375-year leniency', () => {
    expect(getEraMaxDistance(1300)).toBe(375);
    expect(getEraMaxDistance(1200)).toBe(375);
  });

  test('early medieval events (<1200) → 475-year leniency', () => {
    expect(getEraMaxDistance(1100)).toBe(475);
    expect(getEraMaxDistance(1000)).toBe(475);
  });
});

test.describe('scoreGuess — exact match', () => {
  test('returns 110 for any exact match (100 base + 10 bonus)', () => {
    expect(scoreGuess(2000, 2000)).toBe(110);
    expect(scoreGuess(1500, 1500)).toBe(110);
    expect(scoreGuess(1100, 1100)).toBe(110);
    expect(scoreGuess(1000, 1000)).toBe(110);
  });
});

test.describe('scoreGuess — modern events (correctYear 2000, maxDistance 150)', () => {
  // distance=10: round(100×(140/150)²) = round(87.11) = 87
  test('near miss (±10 years) → 87', () => {
    expect(scoreGuess(2010, 2000)).toBe(87);
    expect(scoreGuess(1990, 2000)).toBe(87);
  });

  // distance=100: round(100×(50/150)²) = round(11.11) = 11
  test('large miss (±100 years) → 11', () => {
    expect(scoreGuess(2100, 2000)).toBe(11);
    expect(scoreGuess(1900, 2000)).toBe(11);
  });

  // distance ≥ 150 → 0
  test('at or beyond max distance → 0', () => {
    expect(scoreGuess(2150, 2000)).toBe(0);
    expect(scoreGuess(1850, 2000)).toBe(0);
    expect(scoreGuess(2500, 2000)).toBe(0);
  });

  test('score is symmetric (same distance in either direction)', () => {
    expect(scoreGuess(2010, 2000)).toBe(scoreGuess(1990, 2000));
    expect(scoreGuess(2050, 2000)).toBe(scoreGuess(1950, 2000));
  });
});

test.describe('scoreGuess — early modern events (correctYear 1800, maxDistance 200)', () => {
  // distance=100: round(100×(100/200)²) = round(100×0.25) = 25
  test('half-way distance (100 years) → 25', () => {
    expect(scoreGuess(1900, 1800)).toBe(25);
    expect(scoreGuess(1700, 1800)).toBe(25);
  });

  // distance=200 → 0
  test('at max distance (200 years) → 0', () => {
    expect(scoreGuess(2000, 1800)).toBe(0);
    expect(scoreGuess(1600, 1800)).toBe(0);
  });

  test('beyond max distance → 0', () => {
    expect(scoreGuess(2001, 1800)).toBe(0);
  });
});

test.describe('scoreGuess — early medieval events (correctYear 1100, maxDistance 475)', () => {
  // distance=100: round(100×(375/475)²) = round(100×0.62327) = 62
  test('moderate miss (100 years) → 62', () => {
    expect(scoreGuess(1200, 1100)).toBe(62);
    expect(scoreGuess(1000, 1100)).toBe(62);
  });

  // distance=475 → 0
  test('at max distance (475 years) → 0', () => {
    expect(scoreGuess(1575, 1100)).toBe(0);
    expect(scoreGuess(625, 1100)).toBe(0);
  });
});

test.describe('scoreToDot — tier boundaries', () => {
  test('110 (perfect) → gem', () => expect(scoreToDot(110)).toBe('gem'));
  test('109 → artifact (just below gem)', () => expect(scoreToDot(109)).toBe('artifact'));
  test('85 → artifact (boundary)', () => expect(scoreToDot(85)).toBe('artifact'));
  test('84 → coin (just below artifact)', () => expect(scoreToDot(84)).toBe('coin'));
  test('65 → coin (boundary)', () => expect(scoreToDot(65)).toBe('coin'));
  test('64 → fossil (just below coin)', () => expect(scoreToDot(64)).toBe('fossil'));
  test('20 → fossil (boundary)', () => expect(scoreToDot(20)).toBe('fossil'));
  test('19 → rock (just below fossil)', () => expect(scoreToDot(19)).toBe('rock'));
  test('0 → rock', () => expect(scoreToDot(0)).toBe('rock'));
});

test.describe('buildEmojiRow', () => {
  test('maps all five tiers to their correct emoji', () => {
    // 110→gem, 85→artifact, 65→coin, 20→fossil, 0→rock
    expect(buildEmojiRow([110, 85, 65, 20, 0])).toBe(
      `${DOT_EMOJI.gem} ${DOT_EMOJI.artifact} ${DOT_EMOJI.coin} ${DOT_EMOJI.fossil} ${DOT_EMOJI.rock}`
    );
  });

  test('all perfect scores give all gem emojis', () => {
    expect(buildEmojiRow([110, 110, 110, 110, 110])).toBe(
      Array(5).fill(DOT_EMOJI.gem).join(' ')
    );
  });

  test('all zeroes give all rock emojis', () => {
    expect(buildEmojiRow([0, 0, 0, 0, 0])).toBe(
      Array(5).fill(DOT_EMOJI.rock).join(' ')
    );
  });
});
