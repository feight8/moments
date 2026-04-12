interface PlusBadgeProps {
  size?: "sm" | "md";
}

export default function PlusBadge({ size = "sm" }: PlusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-gold to-amber-500 font-sans font-bold text-white tracking-wide ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      }`}
    >
      💎 PLUS
    </span>
  );
}
