"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildQuestions } from "@/lib/game-engine";
import { GERMAN_ACCENTS, getLanguage } from "@/lib/languages";
import { speak } from "@/lib/speech";
import { type AnswerResult, checkAnswer } from "@/lib/text";
import { SpeakButton } from "../SpeakButton";
import { AccentBar } from "../WordEntry";
import { Feedback, type GameProps, GameTopBar, PromptCard } from "./shared";

function hintPattern(solution: string): string {
  return solution
    .split(" ")
    .map((w) => (w.length ? w[0] + "_".repeat(Math.max(0, w.length - 1)) : ""))
    .join("  ");
}

export default function Typing(props: GameProps) {
  const { words, pool, cfg, direction, list, tracker, onDone, speechRate, autoSpeak } = props;
  const questions = useMemo(() => buildQuestions(words, pool, cfg, direction), [words, pool, cfg, direction]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = questions[i];
  const lang = getLanguage(list.targetLang);

  useEffect(() => {
    if (q && autoSpeak && q.promptIsForeign) speak(q.prompt, list.targetLang, speechRate);
    inputRef.current?.focus();
  }, [q, autoSpeak, list.targetLang, speechRate]);

  if (!q) return null;

  function submit(giveUp = false) {
    if (result) return;
    const r: AnswerResult = giveUp ? "wrong" : checkAnswer(value, q.solution, cfg);
    setResult(r);
    tracker.record(q.word.id, r);
    if (!q.promptIsForeign && r !== "wrong") speak(q.solution, list.targetLang, speechRate);
    if (r === "correct") setTimeout(next, 900);
  }

  function next() {
    setResult(null);
    setValue("");
    if (i + 1 >= questions.length) onDone();
    else setI((x) => x + 1);
  }

  return (
    <div className="pb-48">
      <GameTopBar exitHref={`/spielen/${list.id}`} value={i} max={questions.length} combo={tracker.combo} xp={tracker.xp} />
      <PromptCard key={i} label={q.promptIsForeign ? "Schreib auf Deutsch:" : `Schreib auf ${lang.name}:`}>
        <div className="flex items-center justify-center gap-3">
          <span className="font-display text-4xl font-semibold break-words">{q.prompt}</span>
          {q.promptIsForeign && <SpeakButton text={q.prompt} lang={list.targetLang} rate={speechRate} />}
        </div>
        {cfg.letterHints && <div className="mt-3 font-mono text-xl tracking-widest text-ink-soft">{hintPattern(q.solution)}</div>}
      </PromptCard>
      <form
        className="mt-6 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (result && result !== "correct") next();
          else if (value.trim()) submit();
        }}
      >
        <input
          ref={inputRef}
          className={`input !text-2xl font-display text-center ${
            result === "correct" ? "!border-mint !bg-mint/10" : result === "almost" ? "!border-sun-dark" : result === "wrong" ? "!border-coral anim-shake" : ""
          }`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={!!result}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label="Deine Antwort"
          placeholder="Deine Antwort …"
        />
        <AccentBar
          chars={q.promptIsForeign ? GERMAN_ACCENTS : lang.accents}
          onPick={(c) => {
            setValue((v) => v + c);
            inputRef.current?.focus();
          }}
        />
        {!result && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost !text-base" onClick={() => submit(true)}>
              🤷 Weiß nicht
            </button>
            <button type="submit" className="btn btn-mint flex-1" disabled={!value.trim()}>
              Prüfen ✓
            </button>
          </div>
        )}
      </form>
      {result && result !== "correct" && <Feedback result={result} solution={q.solution} onNext={next} />}
    </div>
  );
}
