"use client";
import { useState } from "react";
import { GradePicker } from "@/components/Pickers";
import { LANGUAGES, LIST_EMOJIS } from "@/lib/languages";
import type { Grade } from "@/lib/types";

export interface ListMeta {
  title: string;
  targetLang: string;
  grade: Grade;
  emoji: string;
}

export function ListMetaForm({
  initial,
  onSubmit,
  submitLabel,
  extraActions,
}: {
  initial: ListMeta;
  onSubmit: (m: ListMeta, action?: string) => void;
  submitLabel: string;
  extraActions?: { id: string; label: string; className?: string }[];
}) {
  const [meta, setMeta] = useState(initial);
  const valid = meta.title.trim().length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit({ ...meta, title: meta.title.trim() });
      }}
      className="flex flex-col gap-5"
    >
      <div>
        <label htmlFor="title" className="font-display text-lg font-semibold block mb-2">
          Name der Liste
        </label>
        <input
          id="title"
          className="input"
          value={meta.title}
          maxLength={40}
          placeholder="z. B. Unit 3: My family"
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
        />
      </div>
      <div>
        <div className="font-display text-lg font-semibold mb-2">Sprache</div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button
              type="button"
              key={l.code}
              onClick={() => setMeta({ ...meta, targetLang: l.code })}
              className={`rounded-2xl border-2 px-3 py-2.5 font-display font-semibold text-left flex items-center gap-2 ${
                meta.targetLang === l.code ? "border-primary bg-primary/10" : "border-line bg-white"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {l.flag}
              </span>
              {l.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="font-display text-lg font-semibold mb-2">Klassenstufe</div>
        <GradePicker value={meta.grade} onChange={(grade) => setMeta({ ...meta, grade })} />
      </div>
      <div>
        <div className="font-display text-lg font-semibold mb-2">Bild</div>
        <div className="grid grid-cols-8 gap-1.5">
          {LIST_EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setMeta({ ...meta, emoji: e })}
              aria-label={`Bild ${e}`}
              className={`aspect-square rounded-xl text-2xl border-2 ${meta.emoji === e ? "border-primary bg-primary/10" : "border-transparent"}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <button type="submit" className="btn btn-mint w-full" disabled={!valid}>
          {submitLabel}
        </button>
        {extraActions?.map((a) => (
          <button
            type="button"
            key={a.id}
            className={`btn w-full ${a.className ?? "btn-sky"}`}
            disabled={!valid}
            onClick={() => valid && onSubmit({ ...meta, title: meta.title.trim() }, a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>
    </form>
  );
}
