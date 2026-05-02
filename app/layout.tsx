import type { Metadata } from "next";
import Link from "next/link";
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
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-sans text-xs text-ink-muted/50">
              <span>Circa Game</span>
              <span aria-hidden="true">·</span>
              <span>© 2026 Charbella Games LLC</span>
              <span aria-hidden="true">·</span>
              <Link href="/privacy" className="hover:text-ink-muted transition-colors">Privacy Policy</Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms" className="hover:text-ink-muted transition-colors">Terms of Service</Link>
              <span aria-hidden="true">·</span>
              <Link href="/dmca" className="hover:text-ink-muted transition-colors">DMCA / Copyright</Link>
            </div>
          </footer>
        </body>
    </html>
  );
}
