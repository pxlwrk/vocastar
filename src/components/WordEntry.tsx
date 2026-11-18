"use client";
import { useRef, useState } from "react";
import { GERMAN_ACCENTS, getLanguage } from "@/lib/languages";
import { sfx } from "@/lib/sound";
import type { WordPair } from "@/lib/types";

export function AccentBar({ chars, onPick }: { chars: string[]; onPick: (c: string) => void }) {
  if (!chars.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {chars.map((c) => (
        <button
          key={c}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(c)}
          className="h-10 min-w-10 px-2 rounded-xl bg-white border-2 border-line font-display text-lg active:scale-90"
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function WordEntry({ targetLang, onAdd }: { targetLang: string; onAdd: (p: WordPair) => void | Promise<void> }) {
  const lang = getLanguage(targetLang);
  const [foreign, setForeign] = useState("");
  const [de, setDe] = useState("");
  const [focus, setFocus] = useState<"foreign" | "de">("foreign");
  const fRef = useRef<HTMLInputElement>(null);
  const dRef = useRef<HTMLInputElement>(null);

  async function add() {
    const pair = { foreign: foreign.trim(), de: de.trim() };
    if (!pair.foreign || !pair.de) return;
    setForeign("");
    setDe("");
    fRef.current?.focus();
    sfx.coin();
    await onAdd(pair);
  }

  function insert(c: string) {
    const ref = focus === "foreign" ? fRef : dRef;
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + c + el.value.slice(end);
    (focus === "foreign" ? setForeign : setDe)(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + c.length, start + c.length);
    });
  }

  return (
    <form
      className="card p-4 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void add();
      }}
    >
      <div>
        <label className="text-sm font-bold text-ink-soft" htmlFor="w-foreign">
          {lang.flag} {lang.name}
        </label>
        <input
          id="w-foreign"
          ref={fRef}
          className="input"
          value={foreign}
          autoFocus
          autoCapitalize="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="next"
          onFocus={() => setFocus("foreign")}
          onChange={(e) => setForeign(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              dRef.current?.focus();
            }
          }}
          placeholder={lang.code === "en-GB" ? "z. B. the dog" : "Fremdwort"}
        />
      </div>
      <div>
        <label className="text-sm font-bold text-ink-soft" htmlFor="w-de">
          🇩🇪 Deutsch
        </label>
        <input
          id="w-de"
          ref={dRef}
          className="input"
          value={de}
          autoComplete="off"
          enterKeyHint="done"
          onFocus={() => setFocus("de")}
          onChange={(e) => setDe(e.target.value)}
          placeholder="z. B. der Hund"
        />
      </div>
      <AccentBar chars={focus === "foreign" ? lang.accents : GERMAN_ACCENTS} onPick={insert} />
      <button type="submit" className="btn btn-mint" disabled={!foreign.trim() || !de.trim()}>
        ＋ Hinzufügen
      </button>
      <p className="text-xs text-ink-soft text-center">Tipp: Mehrere Bedeutungen mit Komma trennen, z. B. „groß, riesig“.</p>
    </form>
  );
}
