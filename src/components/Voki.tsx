"use client";

export type VokiMood = "happy" | "cheer" | "think" | "sad" | "sleep";

/** Voki, die Lern-Eule. */
export function Voki({ mood = "happy", size = 96, className = "" }: { mood?: VokiMood; size?: number; className?: string }) {
  const eyes =
    mood === "sleep" ? (
      <>
        <path d="M36 50 q8 6 16 0" stroke="#2b2050" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <path d="M68 50 q8 6 16 0" stroke="#2b2050" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </>
    ) : mood === "cheer" ? (
      <>
        <path d="M36 52 q8 -9 16 0" stroke="#2b2050" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M68 52 q8 -9 16 0" stroke="#2b2050" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="44" cy="50" r="7" fill="#2b2050" />
        <circle cx="76" cy="50" r="7" fill="#2b2050" />
        <circle cx="46.5" cy="47.5" r="2.4" fill="white" />
        <circle cx="78.5" cy="47.5" r="2.4" fill="white" />
      </>
    );
  const brows =
    mood === "sad" ? (
      <>
        <path d="M33 37 l14 5" stroke="#5b21b6" strokeWidth="3" strokeLinecap="round" />
        <path d="M87 37 l-14 5" stroke="#5b21b6" strokeWidth="3" strokeLinecap="round" />
      </>
    ) : mood === "think" ? (
      <path d="M70 36 l14 -3" stroke="#5b21b6" strokeWidth="3" strokeLinecap="round" />
    ) : null;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Voki die Eule"
    >
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#00000014" />
      {/* Ohren */}
      <path d="M26 30 L34 8 L46 26 Z" fill="#7c3aed" />
      <path d="M94 30 L86 8 L74 26 Z" fill="#7c3aed" />
      {/* Körper */}
      <ellipse cx="60" cy="66" rx="40" ry="44" fill="#8b5cf6" />
      <ellipse cx="60" cy="80" rx="26" ry="27" fill="#ede9fe" />
      {/* Bauchfedern */}
      <path d="M50 76 q5 5 10 0 q5 5 10 0" stroke="#c4b5fd" strokeWidth="2.5" fill="none" />
      <path d="M48 87 q6 5 12 0 q6 5 12 0" stroke="#c4b5fd" strokeWidth="2.5" fill="none" />
      {/* Augen */}
      <circle cx="44" cy="50" r="15" fill="white" />
      <circle cx="76" cy="50" r="15" fill="white" />
      {eyes}
      {brows}
      {/* Schnabel */}
      <path d="M55 62 L65 62 L60 71 Z" fill="#ffc83d" stroke="#e0a400" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Flügel */}
      {mood === "cheer" ? (
        <>
          <path d="M22 62 q-16 -18 -6 -30 q8 14 18 22 Z" fill="#7c3aed" />
          <path d="M98 62 q16 -18 6 -30 q-8 14 -18 22 Z" fill="#7c3aed" />
        </>
      ) : (
        <>
          <path d="M22 60 q-6 22 10 34 q2 -18 -2 -30 Z" fill="#7c3aed" />
          <path d="M98 60 q6 22 -10 34 q-2 -18 2 -30 Z" fill="#7c3aed" />
        </>
      )}
      {/* Füße */}
      <path d="M46 106 l-4 6 M50 107 l0 6 M54 106 l4 6" stroke="#e0a400" strokeWidth="3" strokeLinecap="round" />
      <path d="M66 106 l-4 6 M70 107 l0 6 M74 106 l4 6" stroke="#e0a400" strokeWidth="3" strokeLinecap="round" />
      {/* Wangen */}
      <circle cx="32" cy="66" r="5" fill="#f9a8d4" opacity="0.7" />
      <circle cx="88" cy="66" r="5" fill="#f9a8d4" opacity="0.7" />
    </svg>
  );
}

export function SpeechBubble({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative card px-4 py-3 font-display text-lg leading-snug anim-pop ${className}`}>
      {children}
      <span className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rotate-45 bg-white border-l-2 border-b-2 border-line" />
    </div>
  );
}
