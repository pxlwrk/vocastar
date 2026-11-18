"use client";
import { useEffect, useMemo, useState } from "react";
import { buildQuestions } from "@/lib/game-engine";
import { speak } from "@/lib/speech";
import { SpeakButton } from "../SpeakButton";
import { Feedback, type GameProps, GameTopBar, optionStyle, PromptCard } from "./shared";

export default function Quiz(props: GameProps & { listen?: boolean }) {
  const { words, pool, cfg, direction, list, tracker, onDone, speechRate, autoSpeak, listen } = props;
  const questions = useMemo(
    () => buildQuestions(words, pool, cfg, listen ? "foreign-de" : direction),
    [words, pool, cfg, direction, listen],
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = questions[i];

  useEffect(() => {
    if (!q) return;
    if (listen || (autoSpeak && q.promptIsForeign)) {
      const t = setTimeout(() => speak(q.prompt, list.targetLang, speechRate), 250);
      return () => clearTimeout(t);
    }
  }, [q, listen, autoSpeak, list.targetLang, speechRate]);

  if (!q) return null;
  const result = picked === null ? null : picked === q.solution ? "correct" : "wrong";

  function choose(opt: string) {
    if (picked !== null) return;
    setPicked(opt);
    tracker.record(q.word.id, opt === q.solution ? "correct" : "wrong");
    if (!q.promptIsForeign && opt === q.solution) speak(q.solution, list.targetLang, speechRate);
    if (opt === q.solution) setTimeout(next, 900);
  }

  function next() {
    setPicked(null);
    if (i + 1 >= questions.length) onDone();
    else setI((x) => x + 1);
  }

  return (
    <div className="pb-40">
      <GameTopBar exitHref={`/spielen/${list.id}`} value={i} max={questions.length} combo={tracker.combo} xp={tracker.xp} />
      <PromptCard key={i} label={listen ? "Hör gut zu!" : q.promptIsForeign ? "Was bedeutet …" : "Wie sagt man …"}>
        {listen ? (
          <div className="flex flex-col items-center gap-3">
            <SpeakButton text={q.prompt} lang={list.targetLang} rate={speechRate} size="lg" className="!h-24 !w-24 !text-5xl" />
            <button className="text-sm font-semibold text-sky-dark underline" onClick={() => speak(q.prompt, list.targetLang, "slow")}>
              🐢 Langsam abspielen
            </button>
            {picked && <div className="font-display text-2xl font-semibold anim-pop">{q.prompt}</div>}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <span className="font-display text-4xl font-semibold break-words">{q.prompt}</span>
            {q.promptIsForeign && <SpeakButton text={q.prompt} lang={list.targetLang} rate={speechRate} />}
          </div>
        )}
      </PromptCard>
      <div className="grid gap-3 mt-6">
        {q.options.map((opt, idx) => {
          const state = picked === null ? "idle" : opt === q.solution ? "correct" : opt === picked ? "wrong" : "dim";
          return (
            <button
              key={opt + idx}
              onClick={() => choose(opt)}
              disabled={picked !== null}
              className={`rounded-2xl border-2 min-h-16 px-4 py-3 font-display text-xl font-semibold transition anim-slide-up ${optionStyle(state)}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {result === "wrong" && <Feedback result="wrong" solution={q.solution} onNext={next} />}
    </div>
  );
}
