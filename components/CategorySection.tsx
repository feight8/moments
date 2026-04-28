"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StatusResponse {
  isAdmin: boolean;
  categoriesEnabled: boolean;
}

// Slug → display label
const CATEGORY_LABELS: Record<string, string> = {
  "sports":      "sports",
  "pop-culture": "pop culture",
  "science":     "science",
  "arts":        "arts & culture",
  "politics":    "politics",
};

export default function CategorySection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/plus/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const status: StatusResponse = await res.json();
      setVisible(status.isAdmin || status.categoriesEnabled);
    }
    check();
  }, []);

  if (!visible) return null;

  return (
    <section className="space-y-3">
      <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-muted text-center">
        category puzzles
      </p>
      <div className="space-y-2">
        {Object.entries(CATEGORY_LABELS).map(([slug, label]) => (
          <a
            key={slug}
            href={`/play?category=${slug}`}
            className="flex items-center justify-between rounded-2xl border border-ink/10 bg-surface/60 px-5 py-4 hover:bg-surface/80 transition-colors group"
          >
            <p className="font-sans text-sm font-semibold text-ink">{label}</p>
            <span className="text-ink-muted group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        ))}
      </div>
    </section>
  );
}
