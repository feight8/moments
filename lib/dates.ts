/**
 * Returns today's puzzle date as YYYY-MM-DD, keyed to midnight US Central Time.
 * Uses America/Chicago so DST transitions (CST UTC-6 / CDT UTC-5) are handled automatically.
 */
export function todayDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

/** Format a YYYY-MM-DD date string for display, e.g. "april 7, 2026". */
export function formatPuzzleDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day))
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
    .toLowerCase();
}
