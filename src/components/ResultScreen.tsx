"use client";
import Link from "next/link";
import { useEffect } from "react";
import { achievementDef, type RoundResult } from "@/lib/repo";
import { sfx } from "@/lib/sound";
import type { Word } from "@/lib/types";
import { SpeechBubble, Voki } from "./Voki";

async function confetti(big: boolean) {
  const { default: c } = await import("canvas-confetti");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  c({ particleCount: big ? 160 : 80, spread: big ? 100 : 70, origin: { y: 0.35 }, colors: ["#7c3aed", "#ffc83d", "#22c55e", "#fb6f5b", "#38bdf8"] });
  if (big) setTimeout(() => c({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.6 } }), 300);
  if (big) setTimeout(() => c({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.6 } }), 450);
}

export function ResultScreen({
  result,
  wrongWords,
  listId,
  onAgain,
  score,
  scoreLabel,
}: {
  result: RoundResult;
  wrongWords: Word[];
  listId: string;
  onAgain: () => void;
  score?: number;
  scoreLabel?: string;
}) {
  useEffect(() => {
    if (result.stars >= 2 || result.leveledUp) {
      sfx.win();
      void confetti(result.stars === 3 || result.leveledUp);
    }
    if (result.leveledUp) setTimeout(() => sfx.levelUp(), 700);
  }, [result]);

  const message =
    result.stars === 3
      ? "Wahnsinn! Das war perfekt!"
      : result.stars === 2
        ? "Richtig gut gemacht!"
        : result.stars === 1
          ? "Gut geübt! Beim nächsten Mal klappt noch mehr."
          : "Jede Runde macht dich besser!";

  return (
    <div className="flex flex-col items-center text-center pt-4">
      <div className="flex items-center gap-2 mb-4 self-stretch">
        <Voki mood={result.stars >= 2 ? "cheer" : "happy"} size={96} className="anim-float shrink-0" />
        <SpeechBubble className="text-left">{message}</SpeechBubble>
      </div>

      <div className="flex gap-3 my-4" aria-label={`${result.stars} von 3 Sternen`}>
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`text-6xl anim-pop ${s <= result.stars ? "" : "grayscale opacity-25"}`}
            style={{ animationDelay: `${300 + s * 250}ms`, transform: s === 2 ? "translateY(-12px)" : undefined }}
          >
            ⭐
          </span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 w-full mb-4">
        <div className="card p-3">
          <div className="text-2xl font-display font-bold text-primary">+{result.xp}</div>
          <div className="text-xs font-bold text-ink-soft">XP</div>
        </div>
        <div className="card p-3">
          <div className="text-2xl font-display font-bold text-mint-dark">
            {result.correct}/{result.total}
          </div>
          <div className="text-xs font-bold text-ink-soft">richtig</div>
        </div>
        <div className="card p-3">
          <div className="text-2xl font-display font-bold text-sun-dark">{score ?? `+${result.stars}`}</div>
          <div className="text-xs font-bold text-ink-soft">{scoreLabel ?? "Sterne"}</div>
        </div>
      </div>

      {result.leveledUp && (
        <div className="card w-full p-4 mb-4 !bg-primary !border-primary-dark text-white anim-pop" style={{ animationDelay: "900ms" }}>
          <div className="font-display text-2xl font-bold">🎉 Level {result.newLevel}!</div>
          <div className="font-semibold">Du bist aufgestiegen!</div>
        </div>
      )}
      {result.goalReached && (
        <div className="card w-full p-4 mb-4 !bg-sun/30 !border-sun-dark anim-pop">
          <div className="font-display text-xl font-bold">🎯 Tagesziel erreicht!</div>
        </div>
      )}
      {result.newAchievements.length > 0 && (
        <div className="w-full mb-4">
          <h2 className="font-display text-lg font-semibold mb-2">Neues Abzeichen!</h2>
          <div className="flex flex-col gap-2">
            {result.newAchievements.map((k, i) => {
              const a = achievementDef(k);
              if (!a) return null;
              return (
                <div key={k} className="card p-3 flex items-center gap-3 text-left anim-pop" style={{ animationDelay: `${1100 + i * 200}ms` }}>
                  <span className="text-4xl">{a.emoji}</span>
                  <div>
                    <div className="font-display font-semibold text-lg">{a.title}</div>
                    <div className="text-sm text-ink-soft font-semibold">{a.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {wrongWords.length > 0 && (
        <div className="card w-full p-4 mb-5 text-left">
          <h2 className="font-display text-lg font-semibold mb-2">Diese Wörter üben wir noch:</h2>
          <ul className="flex flex-col gap-1">
            {wrongWords.map((w) => (
              <li key={w.id} className="flex justify-between gap-2 font-semibold">
                <span>{w.foreign}</span>
                <span className="text-ink-soft">{w.de}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full">
        <button className="btn btn-mint w-full !text-xl" onClick={onAgain}>
          🔁 Nochmal spielen
        </button>
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/spielen/${listId}`} className="btn btn-sky">
            🎮 Anderes Spiel
          </Link>
          <Link href="/home" className="btn btn-ghost">
            🏠 Fertig
          </Link>
        </div>
      </div>
    </div>
  );
}
