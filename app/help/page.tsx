"use client";

import NavHeader from "@/components/NavHeader";
import { DOT_EMOJI, type DigTier } from "@/lib/scoring";
import { useSettings } from "@/lib/settings";

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  badge?: string;
}

function Toggle({ label, description, checked, onChange, badge }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-4">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm font-semibold text-ink">{label}</span>
          {badge && (
            <span className="rounded-full bg-ink/8 px-2 py-0.5 text-xs font-sans text-ink-muted">
              {badge}
            </span>
          )}
        </div>
        <p className="font-sans text-xs text-ink-muted leading-relaxed">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold ${
          checked ? "bg-gold" : "bg-ink/20"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Card({ children, divided }: { children: React.ReactNode; divided?: boolean }) {
  return (
    <div className={`rounded-2xl border border-ink/10 bg-surface/60 px-5 backdrop-blur-sm ${divided ? "divide-y divide-ink/8" : "py-5"}`}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scoring row
// ---------------------------------------------------------------------------

function ScoreRow({ distance, score, dot }: { distance: string; score: string; dot: DigTier }) {
  return (
    <div className="flex items-center justify-between py-2 font-sans text-sm">
      <div className="flex items-center gap-2">
        <span>{DOT_EMOJI[dot]}</span>
        <span className="text-ink-muted">{distance}</span>
      </div>
      <span className="font-semibold text-ink">{score}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HelpPage() {
  const { settings, update } = useSettings();

  return (
    <main className="min-h-screen bg-parchment px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        <NavHeader backHref="/" />

        <div className="space-y-1">
          <h1 className="font-serif text-3xl font-bold text-teal">help & settings</h1>
          <p className="font-sans text-sm text-ink-muted">how to play, scoring, and preferences</p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* HOW TO PLAY                                                          */}
        {/* ------------------------------------------------------------------ */}
        <Section title="How to play">
          <Card>
            <ol className="space-y-4 font-sans text-sm text-ink">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-parchment">1</span>
                <div>
                  <p className="font-semibold">read the event</p>
                  <p className="mt-0.5 text-ink-muted">each puzzle has 5 historical events described in 2-3 sentences. the year is always omitted.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-parchment">2</span>
                <div>
                  <p className="font-semibold">guess the year</p>
                  <p className="mt-0.5 text-ink-muted">drag the slider or tap the year display to type a number. the range is 1000 ce - 2025.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-parchment">3</span>
                <div>
                  <p className="font-semibold">lock it in</p>
                  <p className="mt-0.5 text-ink-muted">press <span className="rounded bg-ink/8 px-1.5 py-0.5 font-mono text-xs">lock in</span> to submit your guess. you'll immediately see the correct year, your score, and the story behind the event.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-parchment">4</span>
                <div>
                  <p className="font-semibold">repeat for all 5</p>
                  <p className="mt-0.5 text-ink-muted">complete all five events to finish the day's puzzle and see your final score. share your results with the emoji card.</p>
                </div>
              </li>
            </ol>
          </Card>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* SCORING                                                              */}
        {/* ------------------------------------------------------------------ */}
        <Section title="Scoring">
          <Card>
            <p className="font-sans text-sm text-ink-muted mb-4">
              each event is worth up to <span className="font-semibold text-ink">100 points</span>, plus a <span className="font-semibold text-gold">+10 bonus</span> for an exact year. score drops smoothly the further off you are, zeroing out at 150+ years.
            </p>
            <div className="divide-y divide-ink/8">
              <ScoreRow distance="exact year" score="110 pts" dot="gem" />
              <ScoreRow distance="~5 years off" score="~93 pts" dot="artifact" />
              <ScoreRow distance="~10 years off" score="~87 pts" dot="artifact" />
              <ScoreRow distance="~25 years off" score="~69 pts" dot="coin" />
              <ScoreRow distance="~50 years off" score="~44 pts" dot="coin" />
              <ScoreRow distance="~75 years off" score="~25 pts" dot="fossil" />
              <ScoreRow distance="~100 years off" score="~11 pts" dot="rock" />
              <ScoreRow distance="150+ years off" score="0 pts" dot="rock" />
            </div>
            <p className="mt-4 font-sans text-xs text-ink-muted">
              max session score: <span className="font-semibold text-ink">550 pts</span> (5 perfect guesses)
            </p>
          </Card>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* DOTS                                                                 */}
        {/* ------------------------------------------------------------------ */}
        <Section title="Result symbols">
          <Card>
            <div className="divide-y divide-ink/8 font-sans text-sm">
              {[
                { emoji: "💎", label: "gem", desc: "exact year - perfect find!" },
                { emoji: "🏺", label: "artifact", desc: "within ~10 years (85+ pts)" },
                { emoji: "🪙", label: "coin", desc: "within ~25 years (65+ pts)" },
                { emoji: "🦴", label: "fossil", desc: "within ~75 years (20+ pts)" },
                { emoji: "🪨", label: "rock", desc: "75+ years off, or 150+ for zero" },
              ].map(({ emoji, label, desc }) => (
                <div key={label} className="flex items-center gap-3 py-2.5">
                  <span className="text-xl">{emoji}</span>
                  <div>
                    <span className="font-semibold text-ink">{label}</span>
                    <span className="ml-2 text-ink-muted">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* STREAKS                                                              */}
        {/* ------------------------------------------------------------------ */}
        <Section title="Streaks">
          <Card>
            <p className="font-sans text-sm text-ink-muted leading-relaxed">
              complete the daily puzzle to start a streak. come back the next day to keep it going - missing a day resets your streak to zero. your longest ever streak is saved separately. streaks are shown on your results card and in the share text.
            </p>
          </Card>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* SETTINGS                                                             */}
        {/* ------------------------------------------------------------------ */}
        <Section title="Settings">
          <Card divided>
            <Toggle
              label="dark mode"
              description="switch to a deep teal and plum colour scheme that's easier on the eyes at night."
              checked={settings.darkMode}
              onChange={(v) => update("darkMode", v)}
            />
            <Toggle
              label="sound effects"
              description="play audio feedback when locking in a guess and revealing results."
              checked={settings.soundEnabled}
              onChange={(v) => update("soundEnabled", v)}
            />
          </Card>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* ABOUT                                                                */}
        {/* ------------------------------------------------------------------ */}
        <Section title="About">
          <Card>
            <div className="font-sans text-sm text-ink-muted space-y-2 leading-relaxed">
              <p>circa is a daily history guessing game. a new puzzle drops every day, same events for everyone, same time to play.</p>
            </div>
          </Card>
        </Section>

        <div className="pb-4" />
      </div>
    </main>
  );
}
