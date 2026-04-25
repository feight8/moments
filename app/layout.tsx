import type { Metadata } from "next";
import SettingsProvider from "@/components/SettingsProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "circa - daily history puzzle",
  description:
    "Five historical events a day. No dates given. Drag a slider to guess the year and score points for accuracy. Build your streak.",
  openGraph: {
    title: "Circa",
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
          <footer className="py-6 text-center">
            <p className="font-sans text-xs text-ink-muted/50">Powered by Charbella Games LLC</p>
          </footer>
        </body>
    </html>
  );
}
