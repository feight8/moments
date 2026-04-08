interface EventCardProps {
  description: string;
  eventNumber: number;
}

export default function EventCard({ description, eventNumber }: EventCardProps) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
      <p className="mb-1 text-xs font-sans font-semibold uppercase tracking-widest text-ink-muted">
        Event {eventNumber}
      </p>
      <p className="font-serif text-lg leading-relaxed text-ink">{description}</p>
      <p className="mt-4 text-xs font-sans text-ink-muted italic">
        When did this happen?
      </p>
    </div>
  );
}
