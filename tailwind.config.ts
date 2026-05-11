import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Themed via CSS variables — auto-swap on data-theme="dark"
        parchment: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--color-ink-muted) / <alpha-value>)",
        gold: "rgb(var(--color-accent) / <alpha-value>)",
        // Static brand colors
        teal: "#255957",
        cyan: "#d4f5f5",
        "dot-green": "#16A34A",
        "dot-yellow": "#CA8A04",
        "dot-orange": "#EA580C",
        "dot-red": "#DC2626",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
