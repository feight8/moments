interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1">
      <span className="text-base" role="img" aria-label="fire">
        🔥
      </span>
      <span className="font-sans text-sm font-semibold text-gold">
        {streak} day{streak === 1 ? "" : "s"}
      </span>
    </div>
  );
}
