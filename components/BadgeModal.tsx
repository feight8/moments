"use client";

import { useEffect, useRef, useState } from "react";
import { badgeReason } from "@/lib/badgeDisplay";
import type { Badge } from "@/types";

interface BadgeModalProps {
  badges: Badge[];
  onClose: () => void;
}

export default function BadgeModal({ badges, onClose }: BadgeModalProps) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const badge = badges[index];
  const isLast = index === badges.length - 1;
  const hasMultiple = badges.length > 1;

  const advance = () => {
    if (isLast) {
      onClose();
    } else {
      setIndex((i) => i + 1);
    }
  };

  // Auto-advance after 4 seconds
  useEffect(() => {
    timerRef.current = setTimeout(advance, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!badge) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label={`Badge earned: ${badge.name}`}
    >
      {/* Card — stop click propagation so overlay click closes but card click doesn't */}
      <div
        className="relative mx-4 max-w-sm w-full rounded-2xl bg-parchment border-2 border-gold shadow-2xl px-8 py-10 flex flex-col items-center gap-4 animate-badge-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sparkle dots */}
        <span className="badge-sparkle badge-sparkle-1" />
        <span className="badge-sparkle badge-sparkle-2" />
        <span className="badge-sparkle badge-sparkle-3" />
        <span className="badge-sparkle badge-sparkle-4" />
        <span className="badge-sparkle badge-sparkle-5" />
        <span className="badge-sparkle badge-sparkle-6" />

        {/* Earned label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-gold/80">
          Badge Earned!
        </p>

        {/* Big icon */}
        {badge.iconUrl ? (
          <img
            src={badge.iconUrl}
            alt=""
            className="w-24 h-24 rounded-full object-cover border-2 border-gold/40 select-none"
          />
        ) : (
          <span className="text-8xl leading-none select-none">{badge.emoji}</span>
        )}

        {/* Name */}
        <h2 className="text-2xl font-bold text-gold text-center leading-tight">
          {badge.name}
        </h2>

        {/* Description */}
        <p className="text-sm text-ink/70 text-center leading-relaxed">
          {badge.description}
        </p>

        {/* Reason earned */}
        <p className="text-xs text-ink/40 text-center uppercase tracking-wide">
          {badgeReason(badge)}
        </p>

        {/* Counter */}
        {hasMultiple && (
          <p className="text-xs text-ink/50">
            {index + 1} of {badges.length}
          </p>
        )}

        {/* Button */}
        <button
          onClick={advance}
          className="mt-2 px-8 py-2.5 bg-gold text-white font-semibold rounded-full text-sm hover:opacity-90 active:scale-95 transition-all"
        >
          {isLast ? "Nice!" : "Next →"}
        </button>
      </div>

      <style jsx>{`
        @keyframes badgePop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-badge-pop {
          animation: badgePop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes sparkleOut {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(1.5); opacity: 0; }
        }
        .badge-sparkle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d4a017;
          animation: sparkleOut 0.7s 0.2s ease-out forwards;
        }
        .badge-sparkle-1 { --tx: -80px; --ty: -80px; }
        .badge-sparkle-2 { --tx:   0px; --ty: -100px; }
        .badge-sparkle-3 { --tx:  80px; --ty: -80px; }
        .badge-sparkle-4 { --tx:  90px; --ty:  40px; }
        .badge-sparkle-5 { --tx: -90px; --ty:  40px; }
        .badge-sparkle-6 { --tx:   0px; --ty:  100px; }
      `}</style>
    </div>
  );
}
