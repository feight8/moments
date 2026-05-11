let audioCtx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

function tone(
  ac: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  peakGain: number
) {
  const osc = ac.createOscillator();
  const vol = ac.createGain();
  osc.connect(vol);
  vol.connect(ac.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  vol.gain.setValueAtTime(0, startTime);
  vol.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/** Short click played the moment the user taps "Lock In". */
export function playLockIn() {
  try {
    const ac = ctx();
    const t = ac.currentTime;
    tone(ac, 1100, t,        0.06, 0.18);
    tone(ac,  800, t + 0.04, 0.09, 0.12);
  } catch { /* AudioContext unavailable (SSR, blocked, etc.) */ }
}

/**
 * Result reveal sound — tone quality scales with score tier.
 *   110      → ascending 3-note chime (perfect)
 *   85–109   → two ascending notes (great)
 *   65–84    → single warm note (good)
 *   20–64    → single lower note (okay)
 *   0–19     → short descending figure (miss)
 */
export function playReveal(score: number) {
  try {
    const ac = ctx();
    const t = ac.currentTime;

    if (score >= 110) {
      tone(ac, 523, t,        0.22, 0.3);   // C5
      tone(ac, 659, t + 0.11, 0.22, 0.3);  // E5
      tone(ac, 784, t + 0.22, 0.38, 0.3);  // G5
    } else if (score >= 85) {
      tone(ac, 523, t,        0.22, 0.25);  // C5
      tone(ac, 659, t + 0.13, 0.28, 0.25); // E5
    } else if (score >= 65) {
      tone(ac, 440, t, 0.28, 0.2);          // A4
    } else if (score >= 20) {
      tone(ac, 330, t, 0.22, 0.15);         // E4
    } else {
      tone(ac, 300, t,        0.06, 0.14);  // short drop
      tone(ac, 220, t + 0.06, 0.18, 0.1);
    }
  } catch { /* AudioContext unavailable */ }
}
