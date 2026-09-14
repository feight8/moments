/**
 * Client-safe badge display helpers. No server-only imports —
 * used from both server components (admin table) and client components
 * (BadgeModal, /badges gallery).
 */

const CATEGORY_LABELS: Record<string, string> = {
  sports: "sports",
  "pop-culture": "pop culture",
};

/** Human-readable explanation of what earns a badge, e.g. "Reached 1,773 lifetime points". */
export function badgeReason(badge: {
  conditionType: string;
  conditionValue: number | null;
  conditionMeta: Record<string, string> | null;
}): string {
  const v = badge.conditionValue ?? 0;

  switch (badge.conditionType) {
    case "total_score":
      return `Reached ${v.toLocaleString()} lifetime points`;
    case "streak_days":
      return `Reached a ${v}-day streak`;
    case "total_games":
      return `Played ${v} game${v === 1 ? "" : "s"}`;
    case "perfect_games":
      return `Earned ${v} perfect game${v === 1 ? "" : "s"}`;
    case "hat_trick":
      return `Guessed ${v} exact years in one game`;
    case "dead_reckoning":
      return `Scored ${v}+ points with zero exact guesses`;
    case "category_played": {
      const category = badge.conditionMeta?.category;
      const label = category ? CATEGORY_LABELS[category] ?? category : "a category";
      return `Played a ${label} puzzle`;
    }
    case "completionist":
      return "Played every active category puzzle in one day";
    case "group_joined":
      return "Joined a group";
    default:
      return "";
  }
}
