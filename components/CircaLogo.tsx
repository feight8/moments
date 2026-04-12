interface CircaLogoProps {
  className?: string;
}

/**
 * The Circa wordmark. The dot-and-stem of the timeline guess marker
 * replaces the letter "i", tying the logo to the core game mechanic.
 *
 * Uses currentColor for the letterforms so it inherits the parent's text color.
 * The marker is always rendered in brand gold (#D97706).
 */
export default function CircaLogo({ className = "" }: CircaLogoProps) {
  return (
    <svg
      viewBox="0 0 102 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="circa"
      role="img"
    >
      {/* "c" */}
      <text
        x="0"
        y="36"
        fontFamily="Georgia, Cambria, 'Times New Roman', serif"
        fontSize="40"
        fontWeight="bold"
        fill="currentColor"
      >
        c
      </text>

      {/*
        The timeline cursor replaces the letter "i".
        Positioned at x≈27, matching where the 'i' stem would sit after 'c'.

        Stem: full x-height, vertically centered where the stroke would be.
        Tittle: the floating dot above, just like a lowercase 'i'.
      */}
      {/* Glow layer (subtle) */}
      <circle cx="27" cy="3.5" r="6" fill="#D97706" opacity="0.15" />
      {/* Stem */}
      <rect x="24.5" y="9" width="5" height="27" rx="2.5" fill="#D97706" />
      {/* Tittle */}
      <circle cx="27" cy="3.5" r="4.5" fill="#D97706" />

      {/* "rca" */}
      <text
        x="34"
        y="36"
        fontFamily="Georgia, Cambria, 'Times New Roman', serif"
        fontSize="40"
        fontWeight="bold"
        fill="currentColor"
      >
        rca
      </text>
    </svg>
  );
}
