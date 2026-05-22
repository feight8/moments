"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CategoryValue = "sports" | "pop-culture" | null;

const CATEGORIES: { value: CategoryValue; label: string }[] = [
  { value: null,           label: "daily" },
  { value: "sports",       label: "sports" },
  { value: "pop-culture",  label: "pop culture" },
];

interface CategorySwitcherProps {
  value: CategoryValue;
  onChange: (cat: CategoryValue) => void;
}

export default function CategorySwitcher({ value, onChange }: CategorySwitcherProps) {
  const [canAccess, setCanAccess] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/plus/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const status = await res.json();
      setCanAccess(status.canAccessCategories);
    }
    check();
  }, []);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  if (!canAccess) return null;

  const currentLabel = CATEGORIES.find((c) => c.value === value)?.label ?? "daily";

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-recoleta text-xs transition-colors ${
          open
            ? "border-ink/30 bg-surface text-ink"
            : "border-ink/15 bg-surface/60 text-ink-muted hover:text-ink hover:border-ink/30"
        }`}
      >
        {currentLabel}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-ink/10 bg-surface shadow-lg shadow-ink/5 overflow-hidden z-50 backdrop-blur-sm">
          {CATEGORIES.map(({ value: cat, label }) => (
            <button
              key={String(cat)}
              onClick={() => { onChange(cat); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 font-recoleta text-sm transition-colors hover:bg-ink/5 ${
                value === cat ? "text-ink font-semibold" : "text-ink-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
