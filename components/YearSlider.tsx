"use client";

import { useCallback, useRef, useState } from "react";
import { YEAR_MIN, YEAR_MAX } from "@/lib/scoring";

interface YearSliderProps {
  value: number;
  onChange: (year: number) => void;
  disabled?: boolean;
}

const ERA_LABELS = [
  { year: 1000, label: "1000" },
  { year: 1300, label: "1300" },
  { year: 1600, label: "1600" },
  { year: 1800, label: "1800" },
  { year: 2025, label: "Today" },
];

function clamp(val: number) {
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, val));
}

export default function YearSlider({ value, onChange, disabled = false }: YearSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pct = ((value - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100;

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value, 10));
    },
    [onChange]
  );

  const handleSliderKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      let delta = 0;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") delta = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") delta = 1;
      if (delta === 0) return;
      if (e.shiftKey) delta *= 10;
      if (e.ctrlKey || e.metaKey) delta *= 100;
      e.preventDefault();
      onChange(clamp(value + delta));
    },
    [onChange, value]
  );

  // Year text input handlers
  function handleYearInputFocus() {
    setInputText(String(value));
    setIsEditing(true);
  }

  function handleYearInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputText(e.target.value);
  }

  function commitYearInput() {
    const parsed = parseInt(inputText, 10);
    if (!isNaN(parsed)) {
      onChange(clamp(parsed));
    }
    setIsEditing(false);
    setInputText("");
  }

  function handleYearInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      commitYearInput();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputText("");
      inputRef.current?.blur();
    }
    // Arrow keys nudge while typing
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const base = isEditing && !isNaN(parseInt(inputText)) ? parseInt(inputText) : value;
      const next = clamp(base + 1);
      setInputText(String(next));
      onChange(next);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const base = isEditing && !isNaN(parseInt(inputText)) ? parseInt(inputText) : value;
      const next = clamp(base - 1);
      setInputText(String(next));
      onChange(next);
    }
  }

  const displayValue = isEditing ? inputText : String(value);

  return (
    <div className="w-full space-y-5">
      {/* Year display — click to type */}
      <div className="flex items-baseline justify-center gap-3">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          disabled={disabled}
          onFocus={handleYearInputFocus}
          onChange={handleYearInputChange}
          onBlur={commitYearInput}
          onKeyDown={handleYearInputKeyDown}
          aria-label="Year guess — type or use the slider"
          className={`w-32 bg-transparent text-center font-serif text-5xl font-bold tabular-nums outline-none transition-colors duration-75 disabled:cursor-not-allowed
            ${isDragging || isEditing ? "text-gold" : "text-ink"}
            ${!disabled ? "cursor-text border-b-2 border-transparent focus:border-gold" : ""}
          `}
        />
        <span className="text-sm font-sans text-ink-muted">CE</span>
      </div>

      {!isEditing && !disabled && (
        <p className="text-center text-xs font-sans text-ink-muted/60 -mt-3">
          tap year to type
        </p>
      )}

      {/* Slider track */}
      <div className="relative px-1">
        <div className="relative h-2 rounded-full bg-ink/10">
          <div
            className="absolute left-0 top-0 h-2 rounded-full bg-gold transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={YEAR_MIN}
          max={YEAR_MAX}
          step={1}
          value={value}
          disabled={disabled}
          onChange={handleSliderChange}
          onKeyDown={handleSliderKeyDown}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label={`Year slider: ${value}`}
          aria-valuemin={YEAR_MIN}
          aria-valuemax={YEAR_MAX}
          aria-valuenow={value}
        />
        {/* Custom thumb */}
        <div
          className={`pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white shadow-md transition-transform duration-75 ${
            disabled ? "bg-ink/30" : isDragging ? "scale-125 bg-gold" : "bg-gold"
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>

      {/* Era labels */}
      <div className="flex justify-between px-1">
        {ERA_LABELS.map(({ year, label }) => (
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
