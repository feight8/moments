"use client";

import { useCallback, useEffect, useState } from "react";

export interface Settings {
  /** Play sound effects. No-op until sounds are added — stored for future use. */
  soundEnabled: boolean;
  /** Suppress animations for users who prefer reduced motion. */
  reducedMotion: boolean;
  /** Show text labels alongside emoji dots for color-blind users. */
  colorblindMode: boolean;
  /** Show the year slider position as a number line for improved readability. */
  showSliderTicks: boolean;
}

const DEFAULTS: Settings = {
  soundEnabled: true,
  reducedMotion: false,
  colorblindMode: false,
  showSliderTicks: false,
};

const STORAGE_KEY = "moments_settings";

function load(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore quota errors */ }
}

/** Apply settings as data-attributes on <html> so CSS can respond to them. */
function applyToDOM(settings: Settings) {
  const root = document.documentElement;
  root.dataset.reducedMotion = String(settings.reducedMotion);
  root.dataset.colorblind = String(settings.colorblindMode);
  root.dataset.sliderTicks = String(settings.showSliderTicks);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    const loaded = load();
    setSettings(loaded);
    applyToDOM(loaded);
  }, []);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      applyToDOM(next);
      return next;
    });
  }, []);

  return { settings, update };
}
