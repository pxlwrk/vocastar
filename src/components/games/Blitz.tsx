"use client";
import { useEffect, useRef, useState } from "react";
import { buildQuestion } from "@/lib/game-engine";
import { sfx } from "@/lib/sound";
import { shuffle } from "@/lib/text";
import type { Word } from "@/lib/types";
import { type GameProps, GameTopBar, optionStyle } from "./shared";

export default function Blitz(props: GameProps) {
  const { pool, cfg, direction, list, tracker, onDone } = props;
  const total = cfg.blitzSeconds;
  const [phase, setPhase] = useState<"ready" | "play">("ready");
  const [countdown, setCountdown] = useState(3);
  const [left, setLeft] = useState(total);
  const [score, setScore] = useState(0);
  const queue = useRef<Word[]>([]);
  const [q, setQ] = useState(() => nextQuestion());
  const [picked, setPicked] = useState<string | null>(null);
  const finished = useRef(false);
  const scoreRef = useRef(0);

  function nextQuestion() {
    if (!queue.current.length) queue.current = shuffle(pool);
    const w = queue.current.pop()!;
    return buildQuestion(w, pool, cfg, direction);
  }

  useEffect(() => {
    if (phase !== "ready") return;
    sfx.tap();
    const t = setTimeout(() => {
      if (countdown <= 0) setPhase("play");
      else setCountdown(countdown - 1);
    }, countdown <= 0 ? 400 : 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(t);
          if (!finished.current) {
            finished.current = true;
            setTimeout(() => onDone({ score: scoreRef.current }), 200);
          }
          return 0;
        }
        if (l <= 6) sfx.tap();
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, onDone]);

  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center justify-center mt-24 gap-4">
        <div className="text-6xl" aria-hidden>
          ⚡
        </div>
        <div className="font-display text-2xl font-semibold">Blitzrunde: {total} Sekunden!</div>
        <div key={countdown} className="font-display text-8xl font-bold text-primary anim-pop">
          {countdown || "Los!"}
        </div>
      </div>
    );
  }

  function choose(opt: string) {
    if (picked !== null || left <= 0) return;
    setPicked(opt);
    const ok = opt === q.solution;
    tracker.record(q.word.id, ok ? "correct" : "wrong");
    if (ok) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else {
      setLeft((l) => Math.max(1, l - 3));
    }
    setTimeout(
      () => {
        setPicked(null);
        setQ(nextQuestion());
      },
      ok ? 250 : 700,
    );
  }

  const urgent = left <= 10;
  return (
    <div>
      <GameTopBar
        exitHref={`/spielen/${list.id}`}
        value={left}
        max={total}
        combo={tracker.combo}
        xp={tracker.xp}
        extra={
          <span className={`font-display text-xl font-bold whitespace-nowrap ${urgent ? "text-coral anim-pop" : "text-ink"}`} key={urgent ? left : "t"}>
            ⏱ {left}
          </span>
        }
      />
      <div className="text-center font-display text-lg font-semibold text-ink-soft mb-2">
        Treffer: <span className="text-primary text-2xl">{score}</span>
      </div>
      <div className="card px-5 py-8 text-center">
        <span className="font-display text-4xl font-semibold break-words">{q.prompt}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        {q.options.map((opt, idx) => {
          const state = picked === null ? "idle" : opt === q.solution ? "correct" : opt === picked ? "wrong" : "dim";
          return (
            <button
              key={opt + idx}
              onClick={() => choose(opt)}
              className={`rounded-2xl border-2 min-h-20 px-3 py-2 font-display text-lg font-semibold transition ${optionStyle(state)} ${
                q.options.length % 2 === 1 && idx === q.options.length - 1 ? "col-span-2" : ""
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-ink-soft font-semibold mt-4">Falsche Antwort kostet 3 Sekunden</p>
    </div>
  );
}
