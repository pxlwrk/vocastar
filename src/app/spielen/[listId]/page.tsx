"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { DifficultyPicker } from "@/components/Pickers";
import { Header, Page } from "@/components/ui";
import { SpeechBubble, Voki } from "@/components/Voki";
import { useProfile } from "@/hooks/useProfile";
import { db } from "@/lib/db";
import { getLanguage } from "@/lib/languages";
import { DIFFICULTIES } from "@/lib/levels";
import { MODES } from "@/lib/modes";
import { updateProfile } from "@/lib/repo";
import { sfx } from "@/lib/sound";

export default function GameMenu() {
  const { listId } = useParams<{ listId: string }>();
  const profile = useProfile();
  const data = useLiveQuery(async () => {
    const list = await db.lists.get(listId);
    const count = await db.words.where("listId").equals(listId).count();
    const playedModes = profile
      ? new Set((await db.sessions.where("profileId").equals(profile.id).toArray()).filter((s) => s.listId === listId).map((s) => s.mode))
      : new Set<string>();
    return { list, count, playedModes };
  }, [listId, profile?.id]);
  const [reverse, setReverse] = useState(false);

  if (!profile || !data) return null;
  const { list, count, playedModes } = data;
  if (!list) return null;
  const lang = getLanguage(list.targetLang);
  const cfg = DIFFICULTIES[profile.difficulty];
  const canChooseDirection = cfg.direction !== "mixed";
  const baseForeignFirst = cfg.direction === "foreign-de";
  const foreignFirst = reverse ? !baseForeignFirst : baseForeignFirst;
  const query = canChooseDirection && reverse ? "?r=1" : "";

  return (
    <Page tabs={false}>
      <Header
        title={
          <>
            {list.emoji} {list.title}
          </>
        }
        back={`/listen/${list.id}`}
      />
      <div className="flex items-center gap-2 mb-5">
        <Voki mood="cheer" size={72} className="shrink-0" />
        <SpeechBubble>Welches Spiel spielen wir? {count} Wörter warten auf dich!</SpeechBubble>
      </div>

      <section className="card p-4 mb-5">
        <h2 className="font-display text-lg font-semibold mb-3">Schwierigkeit</h2>
        <DifficultyPicker
          compact
          value={profile.difficulty}
          onChange={(d) => {
            sfx.tap();
            void updateProfile(profile.id, { difficulty: d });
          }}
        />
        <p className="text-sm text-ink-soft font-semibold mt-3 text-center">
          {cfg.description}
          {cfg.xpMultiplier > 1 && ` · ×${String(cfg.xpMultiplier).replace(".", ",")} XP`}
        </p>
        {canChooseDirection ? (
          <button
            className="mt-3 w-full rounded-2xl border-2 border-line bg-bg-soft py-2.5 font-display font-semibold"
            onClick={() => setReverse((r) => !r)}
          >
            {foreignFirst ? `${lang.flag} → 🇩🇪` : `🇩🇪 → ${lang.flag}`} <span className="text-ink-soft text-sm">(tippen zum Tauschen)</span>
          </button>
        ) : (
          <p className="mt-3 text-center font-display font-semibold">🔀 Beide Richtungen gemischt</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        {MODES.map((m, idx) => {
          const disabled = count < m.minWords;
          return (
            <Link
              key={m.id}
              href={`/spielen/${list.id}/${m.id}${query}`}
              aria-disabled={disabled}
              className={`relative rounded-3xl p-4 text-white flex flex-col gap-1 min-h-32 anim-pop active:translate-y-1 transition ${
                disabled ? "opacity-40 pointer-events-none" : ""
              } ${m.id === "blitz" ? "col-span-2 min-h-24 flex-row items-center gap-3" : ""}`}
              style={{
                background: m.color,
                boxShadow: `0 5px 0 color-mix(in srgb, ${m.color} 70%, black)`,
                animationDelay: `${idx * 40}ms`,
              }}
            >
              <span className="text-4xl" aria-hidden>
                {m.emoji}
              </span>
              <div>
                <div className="font-display text-xl font-semibold leading-tight">{m.title}</div>
                <div className="text-sm font-semibold opacity-90">
                  {m.id === "blitz" ? `${cfg.blitzSeconds} Sekunden · ${m.description}` : m.description}
                </div>
              </div>
              {playedModes.has(m.id) && (
                <span className="absolute top-2 right-3 text-lg" aria-label="schon gespielt">
                  ✓
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
