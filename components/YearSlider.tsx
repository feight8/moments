"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { YEAR_MIN, YEAR_MAX } from "@/lib/scoring";

interface YearSliderProps {
  value: number;
  onChange: (year: number) => void;
  disabled?: boolean;
}

export default function YearSlider({ value, onChange, disabled = false }: YearSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value, 10));
    },
    [onChange]
  );

  // Keyboard: arrow keys move ±1, shift+arrow ±10, ctrl+arrow ±100
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      let delta = 0;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = 1;
      if (delta === 0) return;
      if (e.shiftKey) delta *= 10;
      if (e.ctrlKey || e.metaKey) delta *= 100;
      e.preventDefault();
      onChange(Math.min(YEAR_MAX, Math.max(YEAR_MIN, value + delta)));
    },
    [onChange, value]
  );

  // Derived percentage for custom track fill
  const pct = ((value - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;

  // Era labels
  const eras = [
    { year: 1, label: "1 CE" },
    { year: 500, label: "500" },
    { year: 1000, label: "1000" },
    { year: 1500, label: "1500" },
    { year: 2025, label: "Today" },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Year display */}
      <div className="flex items-baseline justify-center gap-2">
        <span
          className={`font-serif text-5xl font-bold tabular-nums transition-all duration-75 ${
            isDragging ? "text-gold" : "text-ink"
          }`}
        >
          {value}
        </span>
        <span className="text-sm font-sans text-ink-muted">CE</span>
      </div>

      {/* Slider track */}
      <div className="relative px-1">
        <div className="relative h-2 rounded-full bg-ink/10">
          {/* Filled portion */}
          <div
            className="absolute left-0 top-0 h-2 rounded-full bg-gold transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          ref={inputRef}
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={`Year guess: ${value}`}
          aria-valuemin={YEAR_MIN}
          aria-valuemax={YEAR_MAX}
          aria-valuenow={value}
        />
        {/* Thumb */}
        <div
          className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow-md transition-transform duration-75 ${
            disabled ? "bg-ink/30" : isDragging ? "scale-125 bg-gold" : "bg-gold"
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Era labels */}
      <div className="flex justify-between px-1">
        {eras.map(({ year, label }) => (
          <button
            key={year}
            type="button"
            disabled={disabled}
            onClick={() => onChange(year)}
            className="text-xs font-sans text-ink-muted hover:text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
