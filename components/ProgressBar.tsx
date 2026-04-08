interface ProgressBarProps {
  current: number; // 1-based current event index
  total: number;   // always 5
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
              i < current - 1
                ? "bg-gold"
                : i === current - 1
                ? "bg-gold-light"
                : "bg-ink/15"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-ink-muted font-sans tabular-nums">
        {current} / {total}
      </span>
    </div>
  );
}
