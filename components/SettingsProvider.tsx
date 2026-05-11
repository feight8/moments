"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings";

export default function SettingsProvider() {
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.dataset.theme = settings.darkMode ? "dark" : "light";
  }, [settings.darkMode]);

  return null;
}
