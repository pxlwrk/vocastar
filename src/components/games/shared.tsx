"use client";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { comboBonus, ENCOURAGE, pick, PRAISE, XP_ALMOST, XP_PER_CORRECT } from "@/lib/gamification";
import type { DifficultyConfig } from "@/lib/levels";
import type { AnswerResult } from "@/lib/text";
import { sfx } from "@/lib/sound";
import type { Direction, VocabList, Word } from "@/lib/types";
import type { AnswerRecord } from "@/lib/repo";
import { ProgressBar } from "../ui";

export interface Tracker {
  record: (wordId: string, result: AnswerResult, opts?: { silent?: boolean }) => void;
  answers: AnswerRecord[];
  combo: number;
  maxCombo: number;
  xp: number;
}

export function useTracker(): Tracker & { reset: () => void } {
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const comboRef = useRef(0);

  const record = useCallback((wordId: string, result: AnswerResult, opts?: { silent?: boolean }) => {
    const ok = result !== "wrong";
    setAnswers((a) => [...a, { wordId, correct: ok }]);
    if (ok) {
      comboRef.current += 1;
      const c = comboRef.current;
      setCombo(c);
      setMaxCombo((m) => Math.max(m, c));
      setXp((x) => x + (result === "correct" ? XP_PER_CORRECT : XP_ALMOST) + comboBonus(c));
      if (!opts?.silent) (result === "correct" ? sfx.correct : sfx.almost)();
    } else {
      comboRef.current = 0;
      setCombo(0);
      if (!opts?.silent) sfx.wrong();
    }
  }, []);

  const reset = useCallback(() => {
    setAnswers([]);
    setCombo(0);
    setMaxCombo(0);
    setXp(0);
    comboRef.current = 0;
  }, []);

  return { record, answers, combo, maxCombo, xp, reset };
}

export interface GameProps {
  words: Word[];
  pool: Word[];
  list: VocabList;
  cfg: DifficultyConfig;
  direction: Direction;
  speechRate: "slow" | "normal";
  autoSpeak: boolean;
  tracker: Tracker;
  onDone: (extra?: { score?: number }) => void;
}

export function GameTopBar({
  exitHref,
  value,
  max,
  combo,
  xp,
  extra,
}: {
  exitHref: string;
  value: number;
  max: number;
  combo: number;
  xp: number;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <Link href={exitHref} className="h-11 w-11 shrink-0 rounded-full bg-white border-2 border-line flex items-center justify-center text-xl font-bold text-ink-soft" aria-label="Spiel beenden">
        ✕
      </Link>
      <ProgressBar value={value} max={max} className="flex-1" />
      {extra}
      {combo >= 3 && (
        <span key={combo} className="font-display font-bold text-coral anim-pop whitespace-nowrap" aria-label={`${combo} richtig in Folge`}>
          🔥{combo}
        </span>
      )}
      <span className="font-display font-bold text-primary whitespace-nowrap">{xp} XP</span>
    </div>
  );
}

export function Feedback({
  result,
  solution,
  onNext,
  nextLabel = "Weiter",
}: {
  result: AnswerResult | null;
  solution?: string;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const [text] = useState(() => ({ praise: pick(PRAISE), encourage: pick(ENCOURAGE) }));
  if (!result) return null;
  const tone =
    result === "correct"
      ? { bg: "bg-mint/15 border-mint", ink: "text-mint-dark", icon: "🎉", title: text.praise }
      : result === "almost"
        ? { bg: "bg-sun/20 border-sun-dark", ink: "text-sun-dark", icon: "👍", title: "Fast richtig!" }
        : { bg: "bg-coral/15 border-coral", ink: "text-coral-dark", icon: "💪", title: text.encourage };
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t-4 ${tone.bg} bg-white anim-slide-up safe-bottom`}>
      <div className="mx-auto max-w-xl px-4 pt-4 pb-2 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl anim-pop" aria-hidden>
            {tone.icon}
          </span>
          <div className="flex-1 min-w-0">
            <div className={`font-display text-2xl font-bold ${tone.ink}`}>{tone.title}</div>
            {result !== "correct" && solution && (
              <div className="font-semibold text-ink">
                Richtig ist: <span className="font-display text-lg">{solution}</span>
              </div>
            )}
          </div>
        </div>
        {onNext && (
          <button autoFocus className={`btn w-full ${result === "wrong" ? "btn-coral" : "btn-mint"}`} onClick={onNext}>
            {nextLabel} →
          </button>
        )}
      </div>
    </div>
  );
}

export function PromptCard({
  children,
  label,
  className = "",
}: {
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`card px-5 py-6 text-center anim-pop ${className}`}>
      {label && <div className="text-sm font-bold text-ink-soft mb-2 uppercase tracking-wide">{label}</div>}
      {children}
    </div>
  );
}

export function optionStyle(state: "idle" | "correct" | "wrong" | "dim") {
  switch (state) {
    case "correct":
      return "border-mint bg-mint text-white shadow-[0_4px_0_var(--mint-dark)] anim-pop";
    case "wrong":
      return "border-coral bg-coral text-white shadow-[0_4px_0_var(--coral-dark)] anim-shake";
    case "dim":
      return "border-line bg-white opacity-50 shadow-[0_4px_0_var(--line)]";
    default:
      return "border-line bg-white shadow-[0_4px_0_var(--line)] active:translate-y-1 active:shadow-none";
  }
}
