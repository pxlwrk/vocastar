"use client";
import { DIFFICULTIES, DIFFICULTY_ORDER, GRADES } from "@/lib/levels";
import type { Difficulty, Grade } from "@/lib/types";

export function DifficultyPicker({
  value,
  onChange,
  compact = false,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  compact?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Schwierigkeit">
      {DIFFICULTY_ORDER.map((d) => {
        const cfg = DIFFICULTIES[d];
        const active = value === d;
        return (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(d)}
            className={`rounded-2xl border-2 px-2 ${compact ? "py-2" : "py-3"} flex flex-col items-center gap-0.5 transition active:scale-95 ${
              active ? "border-primary bg-primary/10 shadow-[0_4px_0_var(--primary)]" : "border-line bg-white shadow-[0_4px_0_var(--line)]"
            }`}
          >
            <span className={compact ? "text-2xl" : "text-3xl"} aria-hidden>
              {cfg.emoji}
            </span>
            <span className="font-display font-semibold">{cfg.label}</span>
            {!compact && cfg.xpMultiplier > 1 && (
              <span className="text-xs font-bold text-primary">×{String(cfg.xpMultiplier).replace(".", ",")} XP</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function GradePicker({ value, onChange }: { value: Grade; onChange: (g: Grade) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Klassenstufe">
      {GRADES.map((g) => {
        const active = value === g;
        return (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(g)}
            className={`rounded-2xl border-2 py-3 font-display text-xl font-semibold transition active:scale-95 ${
              active ? "border-primary bg-primary/10 shadow-[0_4px_0_var(--primary)]" : "border-line bg-white shadow-[0_4px_0_var(--line)]"
            }`}
          >
            Klasse {g}
          </button>
        );
      })}
    </div>
  );
}
