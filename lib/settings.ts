"use client";

import { useCallback, useEffect, useState } from "react";

export interface Settings {
  soundEnabled: boolean;
}

const DEFAULTS: Settings = {
  soundEnabled: true,
};

const STORAGE_KEY = "circa_settings";

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

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    setSettings(load());
  }, []);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      return next;
    });
  }, []);

  return { settings, update };
}
