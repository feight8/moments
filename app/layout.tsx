import type { Metadata } from "next";
import SettingsProvider from "@/components/SettingsProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "moments — daily history puzzle",
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
      <body className="bg-parchment text-ink antialiased">
          <SettingsProvider />
          {children}
        </body>
    </html>
  );
}
