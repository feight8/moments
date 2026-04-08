/** Returns today's date in UTC as YYYY-MM-DD. */
export function todayUTC(): string {
  return new Date().toISOString().split("T")[0];
}

/** Format a YYYY-MM-DD date string for display, e.g. "April 7, 2026". */
export function formatPuzzleDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
