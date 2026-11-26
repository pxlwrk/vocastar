"use client";
import type { VokiOutfit } from "@/lib/shop";

const HAT_SPACE = 22;

export type VokiMood = "happy" | "cheer" | "think" | "sad" | "sleep";

/** Voki, die Lern-Eule. */
export function Voki({
  mood = "happy",
  size = 96,
  className = "",
  outfit,
}: {
  mood?: VokiMood;
  size?: number;
  className?: string;
  outfit?: VokiOutfit;
}) {
  const hasHat = !!outfit?.head;
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
      viewBox={hasHat ? `0 ${-HAT_SPACE} 120 ${120 + HAT_SPACE}` : "0 0 120 120"}
      width={size}
      height={hasHat ? (size * (120 + HAT_SPACE)) / 120 : size}
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
      {outfit?.neck && <VokiNeck id={outfit.neck} />}
      {outfit?.eyes && <VokiEyes id={outfit.eyes} />}
      {outfit?.head && <VokiHead id={outfit.head} />}
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

/* ---------- Voki-Outfits: direkt in die Eule gezeichnet ---------- */

const INK = "#2b2050";

function VokiHead({ id }: { id: string }) {
  switch (id) {
    case "cap":
      return (
        <g>
          <path d="M36 27 Q38 4 60 3 Q82 4 84 27 Z" fill="#ef4444" />
          <path d="M60 3 L60 27" stroke="#b91c1c" strokeWidth="1.5" />
          <path d="M70 25 Q92 21 102 27 Q92 32 70 30 Z" fill="#b91c1c" />
          <circle cx="60" cy="4" r="3" fill="#b91c1c" />
        </g>
      );
    case "party":
      return (
        <g>
          <path d="M44 26 L60 -18 L76 26 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M52 4 L68 4 M48 15 L72 15" stroke="#ffc83d" strokeWidth="4" />
          <circle cx="60" cy="-18" r="5" fill="#fb6f5b" />
        </g>
      );
    case "headphones":
      return (
        <g>
          <path d="M26 52 Q24 6 60 6 Q96 6 94 52" stroke={INK} strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="17" y="40" width="14" height="24" rx="6" fill="#fb6f5b" stroke={INK} strokeWidth="2" />
          <rect x="89" y="40" width="14" height="24" rx="6" fill="#fb6f5b" stroke={INK} strokeWidth="2" />
        </g>
      );
    case "flowercrown":
      return (
        <g>
          <path d="M30 28 Q60 10 90 28" stroke="#16a34a" strokeWidth="3" fill="none" />
          {[
            [32, 27, "#f472b6"],
            [45, 19, "#ffc83d"],
            [60, 16, "#f472b6"],
            [75, 19, "#a78bfa"],
            [88, 27, "#ffc83d"],
          ].map(([x, y, c], i) => (
            <g key={i}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle
                  key={a}
                  cx={Number(x) + 4.5 * Math.cos((a * Math.PI) / 180)}
                  cy={Number(y) + 4.5 * Math.sin((a * Math.PI) / 180)}
                  r="3.6"
                  fill={String(c)}
                />
              ))}
              <circle cx={Number(x)} cy={Number(y)} r="2.6" fill="#fff7ea" />
            </g>
          ))}
        </g>
      );
    case "tophat":
      return (
        <g>
          <rect x="42" y="-18" width="36" height="40" rx="4" fill={INK} />
          <rect x="42" y="12" width="36" height="7" fill="#fb6f5b" />
          <ellipse cx="60" cy="23" rx="28" ry="6" fill={INK} />
          <rect x="47" y="-14" width="4" height="22" rx="2" fill="#ffffff22" />
        </g>
      );
    case "crown":
      return (
        <g>
          <path
            d="M38 26 L40 2 L50 13 L60 -6 L70 13 L80 2 L82 26 Z"
            fill="#ffc83d"
            stroke="#e0a400"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="60" cy="16" r="4" fill="#ef4444" />
          <circle cx="47" cy="19" r="2.8" fill="#38bdf8" />
          <circle cx="73" cy="19" r="2.8" fill="#22c55e" />
          <circle cx="40" cy="2" r="2.5" fill="#ffe066" />
          <circle cx="60" cy="-6" r="2.5" fill="#ffe066" />
          <circle cx="80" cy="2" r="2.5" fill="#ffe066" />
        </g>
      );
    default:
      return null;
  }
}

function VokiEyes({ id }: { id: string }) {
  if (id === "glasses") {
    return (
      <g fill="none" stroke={INK} strokeWidth="3">
        <circle cx="44" cy="50" r="17" />
        <circle cx="76" cy="50" r="17" />
        <path d="M57 46 Q60 43 63 46" />
        <path d="M27 47 L20 44 M93 47 L100 44" strokeLinecap="round" />
      </g>
    );
  }
  if (id === "sunglasses") {
    return (
      <g>
        <path d="M24 40 H58 V50 Q58 64 41 64 Q24 64 24 50 Z" fill={INK} />
        <path d="M62 40 H96 V50 Q96 64 79 64 Q62 64 62 50 Z" fill={INK} />
        <path d="M58 44 H62" stroke={INK} strokeWidth="4" />
        <path d="M29 45 L37 45 M67 45 L75 45" stroke="#ffffff88" strokeWidth="3" strokeLinecap="round" />
        <path d="M24 42 L18 40 M96 42 L102 40" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }
  return null;
}

function VokiNeck({ id }: { id: string }) {
  if (id === "bowtie") {
    return (
      <g>
        <path d="M46 72 L60 79 L46 86 Z" fill="#fb6f5b" stroke="#d9432f" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M74 72 L60 79 L74 86 Z" fill="#fb6f5b" stroke="#d9432f" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="60" cy="79" r="3.5" fill="#d9432f" />
      </g>
    );
  }
  if (id === "scarf") {
    return (
      <g>
        <path d="M23 74 Q60 90 97 74 L97 83 Q60 99 23 83 Z" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
        <path d="M70 86 L78 85 L81 106 L72 107 Z" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
        <path d="M36 80 L36 89 M50 83 L50 92 M64 84 L64 93 M84 80 L84 88" stroke="#ffc83d" strokeWidth="3" />
        <path d="M72 104 L71 109 M75 104 L75 109 M78 104 L79 109" stroke="#15803d" strokeWidth="1.5" />
      </g>
    );
  }
  return null;
}
