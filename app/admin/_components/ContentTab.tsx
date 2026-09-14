import { createServiceClient } from "@/lib/supabase/server";
import { formatPuzzleDate } from "@/lib/dates";
import type { DbEvent } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  "sports":      "sports",
  "pop-culture": "pop culture",
};

function offsetDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

interface Props {
  date: string;
  category: string | null;
}

export default async function ContentTab({ date, category }: Props) {
  const serviceClient = createServiceClient();
  const prevDate = offsetDate(date, -1);
  const nextDate = offsetDate(date, 1);
  const catParam = category ? `&category=${category}` : "";
  const categoryLabel = category ? (CATEGORY_LABELS[category] ?? category) : "daily";

  // Fetch puzzle
  const puzzleQ = serviceClient
    .from("daily_puzzles")
    .select("date, category, event_ids")
    .eq("date", date);
  const { data: puzzle } = await (
    category ? puzzleQ.eq("category", category) : puzzleQ.is("category", null)
  ).maybeSingle();

  // Fetch events in puzzle order
  let events: DbEvent[] = [];
  if (puzzle) {
    const { data: eventRows } = await serviceClient
      .from("events")
      .select("id, description, year, slug, image_url, additional_context, reveal_image_url, created_at")
      .in("id", puzzle.event_ids as string[]);
    const eventMap = new Map((eventRows ?? []).map((e: DbEvent) => [e.id, e]));
    events = (puzzle.event_ids as string[])
      .map((id) => eventMap.get(id))
      .filter((e): e is DbEvent => e !== undefined);
  }

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <a
          href={`/admin?tab=content&date=${prevDate}${catParam}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-surface/60 font-recoleta text-sm text-ink-muted hover:text-ink transition-colors"
        >
          ←
        </a>
        <div className="text-center">
          <p className="font-recoleta text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
            {categoryLabel}
          </p>
          <p className="font-recoleta text-sm font-semibold text-ink">{formatPuzzleDate(date)}</p>
        </div>
        <a
          href={`/admin?tab=content&date=${nextDate}${catParam}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-surface/60 font-recoleta text-sm text-ink-muted hover:text-ink transition-colors"
        >
          →
        </a>
      </div>

      {/* Category picker */}
      <div className="flex gap-1.5 flex-wrap">
        {([null, "sports", "pop-culture"] as (string | null)[]).map((cat) => {
          const isActive = category === cat;
          const label = cat === null ? "daily" : (CATEGORY_LABELS[cat] ?? cat);
          return (
            <a
              key={cat ?? "daily"}
              href={`/admin?tab=content&date=${date}${cat ? `&category=${cat}` : ""}`}
              className={`rounded-full px-3 py-1 font-recoleta text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-gold text-white"
                  : "bg-surface/60 border border-ink/10 text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      {!puzzle ? (
        <div className="rounded-2xl border border-ink/10 bg-surface/60 px-5 py-10 text-center backdrop-blur-sm">
          <p className="font-recoleta text-base text-ink-muted">no puzzle scheduled</p>
          <p className="font-recoleta text-xs text-ink-muted/60 mt-1">
            {categoryLabel} · {formatPuzzleDate(date)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, i) => (
            <div
              key={event.id}
              className="rounded-2xl border border-ink/10 bg-surface/60 p-4 space-y-2.5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white font-recoleta text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-recoleta text-xl font-bold text-gold">{event.year}</span>
                </div>
                {event.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.image_url}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover opacity-80 flex-shrink-0"
                  />
                )}
              </div>
              <p className="font-recoleta text-sm text-ink leading-relaxed">{event.description}</p>
              {event.additional_context && (
                <p className="font-recoleta text-xs text-ink-muted border-t border-ink/8 pt-2 leading-relaxed">
                  {event.additional_context}
                </p>
              )}
              <p className="font-recoleta text-[9px] text-ink-muted/50 font-mono">{event.slug}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
