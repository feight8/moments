"use client";

import { createContext, useContext } from "react";

export interface Settings {
  soundEnabled: boolean;
  darkMode: boolean;
}

export const SETTINGS_DEFAULTS: Settings = {
  soundEnabled: true,
  darkMode: false,
};

export const SETTINGS_STORAGE_KEY = "circa_settings";

interface SettingsContextValue {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: SETTINGS_DEFAULTS,
  update: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}
