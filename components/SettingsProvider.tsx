"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SettingsContext,
  SETTINGS_DEFAULTS,
  SETTINGS_STORAGE_KEY,
  type Settings,
} from "@/lib/settings";

function load(): Settings {
  if (typeof window === "undefined") return SETTINGS_DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? { ...SETTINGS_DEFAULTS, ...JSON.parse(raw) } : SETTINGS_DEFAULTS;
  } catch {
    return SETTINGS_DEFAULTS;
  }
}

function save(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore quota errors */ }
}

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(SETTINGS_DEFAULTS);

  useEffect(() => {
    setSettings(load());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.darkMode ? "dark" : "light";
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }, [settings.darkMode]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}
