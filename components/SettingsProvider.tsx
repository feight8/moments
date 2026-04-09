"use client";

import { useEffect } from "react";

/**
 * Reads settings from localStorage on mount and applies them as data-attributes
 * on <html> so CSS can respond without a full React context.
 * Renders nothing — purely a side-effect component placed once in the layout.
 */
export default function SettingsProvider() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("moments_settings");
      if (!raw) return;
      const s = JSON.parse(raw);
      const root = document.documentElement;
      if (s.reducedMotion) root.dataset.reducedMotion = "true";
      if (s.colorblindMode) root.dataset.colorblind = "true";
      if (s.showSliderTicks) root.dataset.sliderTicks = "true";
    } catch { /* ignore */ }
  }, []);

  return null;
}
