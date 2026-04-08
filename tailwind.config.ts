import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Moments brand palette
        parchment: "#F5F0E8",
        ink: "#1C1917",
        "ink-muted": "#78716C",
        gold: "#D97706",
        "gold-light": "#FCD34D",
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
