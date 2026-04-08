import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moments — Daily History Puzzle",
  description:
    "Five historical events a day. No dates given. Drag a slider to guess the year and score points for accuracy. Build your streak.",
  openGraph: {
    title: "Moments",
    description: "Can you guess when history happened?",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-parchment text-ink antialiased">{children}</body>
    </html>
  );
}
