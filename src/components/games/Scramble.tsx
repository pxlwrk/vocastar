"use client";
import { useEffect, useMemo, useState } from "react";
import { buildQuestions, letterTiles } from "@/lib/game-engine";
import { speak } from "@/lib/speech";
import { sfx } from "@/lib/sound";
import { SpeakButton } from "../SpeakButton";
import { Feedback, type GameProps, GameTopBar, PromptCard } from "./shared";

export default function Scramble(props: GameProps) {
  const { words, pool, cfg, direction, list, tracker, onDone, speechRate, autoSpeak } = props;
  // Lange Ausdrücke sind als Salat zu schwer: kurze bevorzugen
  const usable = useMemo(() => {
    const short = words.filter((w) => w.foreign.length <= 18 && w.de.length <= 18);
    return short.length >= Math.min(3, words.length) ? short : words;
  }, [words]);
  const questions = useMemo(() => buildQuestions(usable, pool, cfg, direction), [usable, pool, cfg, direction]);
  const [i, setI] = useState(0);
  const q = questions[i];
  const tiles = useMemo(() => (q ? letterTiles(q.solution, cfg.id === "schwer" ? 2 : 0) : []), [q, cfg.id]);
  const slots = useMemo(() => (q ? [...q.solution] : []), [q]);
  const hintCount = cfg.letterHints ? 1 : 0;
  const [userPlaced, setUserPlaced] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(0);
  const [done, setDone] = useState<null | "correct" | "wrong">(null);

  useEffect(() => {
    if (q && autoSpeak && q.promptIsForeign) speak(q.prompt, list.targetLang, speechRate);
  }, [q, autoSpeak, list.targetLang, speechRate]);

  // Tipp: erster Buchstabe ist vorgegeben (zählt als fest platziert)
  const hintIds = useMemo(() => {
    if (!q || !hintCount) return [] as number[];
    const first = q.solution.replace(/ /g, "")[0];
    const t = tiles.find((x) => x.ch === first);
    return t ? [t.id] : [];
  }, [q, tiles, hintCount]);
  const placed = useMemo(() => [...hintIds, ...userPlaced], [hintIds, userPlaced]);
  const setPlaced = (ids: number[]) => setUserPlaced(ids.slice(hintIds.length));

  if (!q) return null;
  const letterSlots = slots.filter((c) => c !== " ").length;
  const typed = placed.map((id) => tiles.find((t) => t.id === id)!.ch).join("");

  function place(id: number) {
    if (done || placed.includes(id) || placed.length >= letterSlots) return;
    sfx.tap();
    const next = [...placed, id];
    setPlaced(next);
    if (next.length === letterSlots) {
      const word = next.map((x) => tiles.find((t) => t.id === x)!.ch).join("");
      if (word.toLowerCase() === q!.solution.replace(/ /g, "").toLowerCase()) {
        setDone("correct");
        tracker.record(q!.word.id, attempts === 0 ? "correct" : "almost");
        if (!q!.promptIsForeign) speak(q!.solution, list.targetLang, speechRate);
        setTimeout(next_, 1100);
      } else {
        setShake((s) => s + 1);
        sfx.wrong();
        const a = attempts + 1;
        setAttempts(a);
        if (a >= 2) {
          setDone("wrong");
          tracker.record(q!.word.id, "wrong", { silent: true });
        } else {
          setTimeout(() => setPlaced(next.slice(0, hintCount)), 500);
        }
      }
    }
  }

  function unplace(index: number) {
    if (done || index < hintCount) return;
    setPlaced(placed.slice(0, index));
  }

  function next_() {
    setDone(null);
    setAttempts(0);
    setUserPlaced([]);
    if (i + 1 >= questions.length) onDone();
    else setI((x) => x + 1);
  }

  // Slots mit Leerzeichen rendern
  let letterIndex = 0;
  return (
    <div className="pb-40">
      <GameTopBar exitHref={`/spielen/${list.id}`} value={i} max={questions.length} combo={tracker.combo} xp={tracker.xp} />
      <PromptCard key={i} label="Bilde das Wort für …">
        <div className="flex items-center justify-center gap-3">
          <span className="font-display text-3xl font-semibold break-words">{q.prompt}</span>
          {q.promptIsForeign && <SpeakButton text={q.prompt} lang={list.targetLang} rate={speechRate} size="sm" />}
        </div>
      </PromptCard>

      <div key={shake} className={`flex flex-wrap justify-center gap-1.5 my-6 ${shake ? "anim-shake" : ""}`}>
        {slots.map((c, idx) => {
          if (c === " ") return <span key={idx} className="w-4" />;
          const li = letterIndex++;
          const ch = typed[li];
          return (
            <button
              key={idx}
              onClick={() => unplace(li)}
              className={`h-12 w-10 rounded-xl border-b-4 font-display text-2xl font-semibold flex items-center justify-center transition ${
                done === "correct"
                  ? "bg-mint text-white border-mint-dark anim-pop"
                  : ch
                    ? "bg-white border-primary text-ink"
                    : "bg-black/5 border-black/15"
              }`}
              style={done === "correct" ? { animationDelay: `${li * 40}ms` } : undefined}
              aria-label={ch ? `Buchstabe ${ch} entfernen` : "leeres Feld"}
            >
              {ch ?? ""}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((t) => {
          const used = placed.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => place(t.id)}
              disabled={used || !!done}
              className={`h-14 w-12 rounded-2xl font-display text-2xl font-semibold transition ${
                used ? "bg-black/5 text-transparent" : "bg-sun shadow-[0_4px_0_var(--sun-dark)] active:translate-y-1 active:shadow-none"
              }`}
            >
              {t.ch}
            </button>
          );
        })}
      </div>
      {!done && placed.length > hintCount && (
        <div className="text-center mt-5">
          <button className="font-semibold text-ink-soft underline" onClick={() => setPlaced(placed.slice(0, hintCount))}>
            ↺ Alles zurück
          </button>
        </div>
      )}
      {done === "wrong" && <Feedback result="wrong" solution={q.solution} onNext={next_} />}
    </div>
  );
}
