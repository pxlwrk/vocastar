"use client";
import { useMemo, useRef, useState } from "react";
import { speak } from "@/lib/speech";
import { sfx } from "@/lib/sound";
import { shuffle } from "@/lib/text";
import { type GameProps, GameTopBar } from "./shared";

interface Card {
  key: string;
  wordId: string;
  text: string;
  foreign: boolean;
}

export default function Memory(props: GameProps) {
  const { words, cfg, list, tracker, onDone, speechRate } = props;
  const pairs = useMemo(() => words.slice(0, cfg.memoryPairs), [words, cfg.memoryPairs]);
  const cards = useMemo<Card[]>(
    () =>
      shuffle(
        pairs.flatMap((w) => [
          { key: w.id + "f", wordId: w.id, text: w.foreign, foreign: true },
          { key: w.id + "d", wordId: w.id, text: w.de, foreign: false },
        ]),
      ),
    [pairs],
  );
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const misses = useRef(new Map<string, number>());
  const busy = useRef(false);

  function tap(card: Card) {
    if (busy.current || matched.has(card.wordId) || open.includes(card.key)) return;
    sfx.flip();
    if (card.foreign) speak(card.text, list.targetLang, speechRate);
    const next = [...open, card.key];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next.map((k) => cards.find((c) => c.key === k)!);
    if (a.wordId === b.wordId) {
      const m = new Set(matched).add(a.wordId);
      setMatched(m);
      setOpen([]);
      tracker.record(a.wordId, (misses.current.get(a.wordId) ?? 0) >= 2 ? "almost" : "correct");
      if (m.size === pairs.length) setTimeout(() => onDone({ score: moves + 1 }), 700);
    } else {
      busy.current = true;
      setWrongPair(next);
      for (const c of [a, b]) misses.current.set(c.wordId, (misses.current.get(c.wordId) ?? 0) + 1);
      setTimeout(() => {
        setOpen([]);
        setWrongPair([]);
        busy.current = false;
      }, 1000);
    }
  }

  const cols = cards.length <= 8 ? "grid-cols-2 sm:grid-cols-4" : cards.length <= 12 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-4";

  return (
    <div>
      <GameTopBar
        exitHref={`/spielen/${list.id}`}
        value={matched.size}
        max={pairs.length}
        combo={tracker.combo}
        xp={tracker.xp}
        extra={<span className="font-display font-semibold text-ink-soft whitespace-nowrap">🔄 {moves}</span>}
      />
      <p className="text-center font-semibold text-ink-soft mb-4">Finde die Paare: Wort und Übersetzung!</p>
      <div className={`grid ${cols} gap-2.5`}>
        {cards.map((c, idx) => {
          const isOpen = open.includes(c.key) || matched.has(c.wordId);
          const isWrong = wrongPair.includes(c.key);
          const isMatched = matched.has(c.wordId);
          return (
            <button
              key={c.key}
              onClick={() => tap(c)}
              aria-label={isOpen ? c.text : "Verdeckte Karte"}
              className={`flip-scene ${cards.length > 8 ? "aspect-square" : "aspect-[4/5]"} anim-pop ${isMatched ? "opacity-80" : ""}`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className={`flip-card h-full ${isOpen ? "is-flipped" : ""}`}>
                <div className="flip-face rounded-2xl bg-primary border-2 border-primary-dark shadow-[0_4px_0_var(--primary-dark)] flex items-center justify-center text-3xl">
                  ⭐
                </div>
                <div
                  className={`flip-face flip-back rounded-2xl border-2 flex items-center justify-center p-1.5 text-center font-display font-semibold leading-tight break-words ${
                    isMatched
                      ? "bg-mint/20 border-mint"
                      : isWrong
                        ? "bg-coral/15 border-coral anim-shake"
                        : c.foreign
                          ? "bg-sky/15 border-sky"
                          : "bg-sun/20 border-sun"
                  } ${c.text.length > 14 ? "text-sm" : c.text.length > 8 ? "text-base" : "text-lg"}`}
                >
                  {c.text}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
