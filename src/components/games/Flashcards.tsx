"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildQuestions } from "@/lib/game-engine";
import { getLanguage } from "@/lib/languages";
import { speak } from "@/lib/speech";
import { sfx } from "@/lib/sound";
import { SpeakButton } from "../SpeakButton";
import { type GameProps, GameTopBar } from "./shared";

export default function Flashcards(props: GameProps) {
  const { words, pool, cfg, direction, list, tracker, onDone, speechRate, autoSpeak } = props;
  const questions = useMemo(() => buildQuestions(words, pool, cfg, direction), [words, pool, cfg, direction]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const start = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const q = questions[i];

  useEffect(() => {
    if (q && autoSpeak && q.promptIsForeign) speak(q.prompt, list.targetLang, speechRate);
  }, [q, autoSpeak, list.targetLang, speechRate]);

  if (!q) return null;

  function answer(knew: boolean) {
    if (leaving) return;
    setLeaving(knew ? "right" : "left");
    tracker.record(q.word.id, knew ? "correct" : "wrong", { silent: !knew });
    if (!knew) sfx.flip();
    setTimeout(() => {
      setLeaving(null);
      setDrag(0);
      setFlipped(false);
      if (i + 1 >= questions.length) onDone();
      else setI(i + 1);
    }, 260);
  }

  const offset = leaving === "right" ? 500 : leaving === "left" ? -500 : drag;

  return (
    <div>
      <GameTopBar exitHref={`/spielen/${list.id}`} value={i} max={questions.length} combo={tracker.combo} xp={tracker.xp} />
      <p className="text-center font-semibold text-ink-soft mb-3">Tippe auf die Karte zum Umdrehen</p>
      <div
        className="flip-scene mx-auto w-full max-w-sm h-80 select-none touch-pan-y"
        style={{
          transform: `translateX(${offset}px) rotate(${offset / 18}deg)`,
          transition: dragging ? "none" : "transform 0.25s",
        }}
        onPointerDown={(e) => {
          start.current = e.clientX;
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (start.current !== null && flipped) setDrag(e.clientX - start.current);
        }}
        onPointerUp={() => {
          const d = drag;
          start.current = null;
          setDragging(false);
          if (flipped && Math.abs(d) > 90) answer(d > 0);
          else if (Math.abs(d) < 8) {
            sfx.flip();
            setFlipped((f) => !f);
            setDrag(0);
          } else setDrag(0);
        }}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setDrag(0);
        }}
      >
        <div className={`flip-card h-full ${flipped ? "is-flipped" : ""}`}>
          <div className="flip-face card flex flex-col items-center justify-center p-6 gap-4">
            <span className="text-sm font-bold text-ink-soft uppercase tracking-wide">{q.promptIsForeign ? "Was heißt das?" : `Wie heißt das auf ${getLanguage(list.targetLang).name}?`}</span>
            <span className="font-display text-4xl font-semibold text-center break-words max-w-full">{q.prompt}</span>
            {q.promptIsForeign && <SpeakButton text={q.prompt} lang={list.targetLang} rate={speechRate} />}
          </div>
          <div className="flip-face flip-back card flex flex-col items-center justify-center p-6 gap-4 !bg-primary/5 !border-primary/40">
            <span className="text-sm font-bold text-ink-soft uppercase tracking-wide">Lösung</span>
            <span className="font-display text-4xl font-semibold text-center text-primary break-words max-w-full">{q.solution}</span>
            {!q.promptIsForeign && <SpeakButton text={q.solution} lang={list.targetLang} rate={speechRate} />}
          </div>
        </div>
      </div>
      <div className={`grid grid-cols-2 gap-3 mt-8 transition ${flipped ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <button className="btn btn-coral !min-h-16" onClick={() => answer(false)}>
          😕 Nochmal üben
        </button>
        <button className="btn btn-mint !min-h-16" onClick={() => answer(true)}>
          😊 Gewusst!
        </button>
      </div>
      {flipped && <p className="text-center text-sm text-ink-soft mt-3 font-semibold">oder Karte nach links / rechts wischen</p>}
    </div>
  );
}
