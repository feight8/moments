"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface BadgeRowActionsProps {
  id: string;
  isActive: boolean;
}

export default function BadgeRowActions({ id, isActive }: BadgeRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/admin/badges/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? "text-ink/60 hover:text-ink border border-ink/20 hover:border-ink/40"
          : "text-gold hover:text-gold/80 border border-gold/30 hover:border-gold/50"
      }`}
    >
      {loading ? "…" : isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
