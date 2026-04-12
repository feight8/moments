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
    <div className={`rounded-2xl border border-ink/10 bg-white/60 px-5 backdrop-blur-sm ${divided ? "divide-y divide-ink/8" : "py-5"}`}>
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
          <h1 className="font-serif text-3xl font-bold text-ink">help & settings</h1>
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
                  <p className="font-semibold">Read the event</p>
                  <p className="mt-0.5 text-ink-muted">Each puzzle has 5 historical events described in 2-3 sentences. The year is always omitted.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-parchment">2</span>
                <div>
                  <p className="font-semibold">Guess the year</p>
                  <p className="mt-0.5 text-ink-muted">Drag the slider or tap the year display to type a number. The range is 1000 CE - 2025.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-parchment">3</span>
                <div>
                  <p className="font-semibold">Lock it in</p>
                  <p className="mt-0.5 text-ink-muted">Press <span className="rounded bg-ink/8 px-1.5 py-0.5 font-mono text-xs">Lock In</span> to submit your guess. You'll immediately see the correct year, your score, and the story behind the event.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-parchment">4</span>
                <div>
                  <p className="font-semibold">Repeat for all 5</p>
                  <p className="mt-0.5 text-ink-muted">Complete all five events to finish the day's puzzle and see your final score. Share your results with the emoji card.</p>
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
              Each event is worth up to <span className="font-semibold text-ink">100 points</span>, plus a <span className="font-semibold text-gold">+10 bonus</span> for an exact year. Score drops smoothly the further off you are — zero points at 150+ years.
            </p>
            <div className="divide-y divide-ink/8">
              <ScoreRow distance="Exact year" score="110 pts" dot="gem" />
              <ScoreRow distance="~5 years off" score="~93 pts" dot="artifact" />
              <ScoreRow distance="~10 years off" score="~87 pts" dot="artifact" />
              <ScoreRow distance="~25 years off" score="~69 pts" dot="coin" />
              <ScoreRow distance="~50 years off" score="~44 pts" dot="coin" />
              <ScoreRow distance="~75 years off" score="~25 pts" dot="fossil" />
              <ScoreRow distance="~100 years off" score="~11 pts" dot="rock" />
              <ScoreRow distance="150+ years off" score="0 pts" dot="rock" />
            </div>
            <p className="mt-4 font-sans text-xs text-ink-muted">
              Max session score: <span className="font-semibold text-ink">550 pts</span> (5 perfect guesses)
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
                { emoji: "💎", label: "Gem", desc: "Exact year — perfect find!" },
                { emoji: "🏺", label: "Artifact", desc: "within ~10 years (85+ pts)" },
                { emoji: "🪙", label: "Coin", desc: "within ~25 years (65+ pts)" },
                { emoji: "🦴", label: "Fossil", desc: "within ~75 years (20+ pts)" },
                { emoji: "🪨", label: "Rock", desc: "75+ years off, or 150+ for zero" },
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
              Complete the daily puzzle to start a streak. Come back the next day to keep it going - missing a day resets your streak to zero. Your longest ever streak is saved separately. Streaks are shown on your results card and in the share text.
            </p>
          </Card>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* SETTINGS                                                             */}
        {/* ------------------------------------------------------------------ */}
        <Section title="Settings">
          <Card divided>
            <Toggle
              label="Sound effects"
              description="Play audio feedback when locking in a guess and revealing results."
              badge="coming soon"
              checked={settings.soundEnabled}
              onChange={(v) => update("soundEnabled", v)}
            />
            <Toggle
              label="Reduced motion"
              description="Suppress spinning and transition animations. Useful if you have motion sensitivity."
              checked={settings.reducedMotion}
              onChange={(v) => update("reducedMotion", v)}
            />
            <Toggle
              label="Colorblind mode"
              description="Add a letter label (G / Y / O / R) alongside each result dot so colour isn't the only indicator."
              checked={settings.colorblindMode}
              onChange={(v) => update("colorblindMode", v)}
            />
            <Toggle
              label="Show slider tick marks"
              description="Display century markers along the year slider for easier navigation."
              checked={settings.showSliderTicks}
              onChange={(v) => update("showSliderTicks", v)}
            />
          </Card>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* ABOUT                                                                */}
        {/* ------------------------------------------------------------------ */}
        <Section title="About">
          <Card>
            <div className="font-sans text-sm text-ink-muted space-y-2 leading-relaxed">
              <p>circa is a daily history guessing game. A new puzzle drops every day — same events for everyone, same time to play.</p>
              <p>Found a bug or have a suggestion? The project is on <a href="https://github.com/feight8/circa" target="_blank" rel="noopener noreferrer" className="text-ink underline hover:text-gold transition-colors">GitHub</a>.</p>
            </div>
          </Card>
        </Section>

        <div className="pb-4" />
      </div>
    </main>
  );
}
