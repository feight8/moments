interface EventCardProps {
  description: string;
  eventNumber: number;
  imageUrl?: string | null;
}

export default function EventCard({ description, eventNumber, imageUrl }: EventCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white/60 shadow-sm backdrop-blur-sm">
      {imageUrl && (
        <div className="relative h-48 w-full overflow-hidden bg-ink/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            onError={(e) => {
              // Hide the image container if the URL fails to load
              const parent = (e.target as HTMLElement).closest(".relative");
              if (parent) (parent as HTMLElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}
      <div className="p-6">
        <p className="mb-2 text-xs font-sans font-semibold uppercase tracking-widest text-ink-muted">
          Event {eventNumber}
        </p>
        <p className="font-serif text-lg leading-relaxed text-ink">{description}</p>
        <p className="mt-4 text-xs font-sans text-ink-muted italic">When did this happen?</p>
      </div>
    </div>
  );
}
