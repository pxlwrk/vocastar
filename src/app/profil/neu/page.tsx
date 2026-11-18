"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { DifficultyPicker, GradePicker } from "@/components/Pickers";
import { Header, Page } from "@/components/ui";
import { SpeechBubble, Voki } from "@/components/Voki";
import { setCurrentProfileId } from "@/lib/current-profile";
import { AVATARS, COLORS } from "@/lib/gamification";
import { DIFFICULTIES } from "@/lib/levels";
import { createProfile } from "@/lib/repo";
import { sfx } from "@/lib/sound";
import type { Difficulty, Grade } from "@/lib/types";

const STEPS = ["Name", "Tier", "Klasse", "Schwierigkeit"];

export default function NewProfile() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [grade, setGrade] = useState<Grade>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("mittel");
  const [saving, setSaving] = useState(false);

  const canNext = step !== 0 || name.trim().length > 0;
  const bubble = [
    "Wie heißt du?",
    `Hallo ${name.trim() || "du"}! Such dir ein Tier aus.`,
    "In welche Klasse gehst du?",
    "Wie schwer soll's werden? Du kannst das jederzeit ändern.",
  ][step];

  async function finish() {
    setSaving(true);
    const p = await createProfile({ name: name.trim(), avatar, color, grade, difficulty });
    sfx.win();
    setCurrentProfileId(p.id);
    router.replace("/home?willkommen=1");
  }

  return (
    <Page tabs={false}>
      <Header title="Neues Profil" back={step === 0 ? "/" : undefined} />
      <div className="flex gap-1.5 mb-5" aria-label={`Schritt ${step + 1} von ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <div key={s} className={`h-2.5 flex-1 rounded-full transition ${i <= step ? "bg-primary" : "bg-black/10"}`} />
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Voki mood={step === 3 ? "think" : "happy"} size={80} className="shrink-0" />
        <SpeechBubble key={step}>{bubble}</SpeechBubble>
      </div>

      <div className="card p-5 anim-slide-up" key={step}>
        {step === 0 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (canNext) setStep(1);
            }}
          >
            <label className="font-display text-lg font-semibold block mb-2" htmlFor="name">
              Dein Vorname
            </label>
            <input
              id="name"
              className="input text-2xl font-display"
              value={name}
              autoFocus
              maxLength={20}
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Mia"
            />
          </form>
        )}
        {step === 1 && (
          <div>
            <div className="flex justify-center mb-4">
              <Avatar profile={{ avatar, color }} size={110} className="anim-pop" key={avatar + color} />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    sfx.tap();
                    setAvatar(a);
                  }}
                  aria-label={`Tier ${a}`}
                  className={`aspect-square rounded-2xl text-4xl border-2 transition active:scale-90 ${
                    a === avatar ? "border-primary bg-primary/10" : "border-line bg-white"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`Farbe ${c}`}
                  className={`h-11 w-11 rounded-full border-4 transition active:scale-90 ${c === color ? "border-ink scale-110" : "border-white"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}
        {step === 2 && <GradePicker value={grade} onChange={setGrade} />}
        {step === 3 && (
          <div>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            <p className="mt-4 text-center text-ink-soft font-semibold">{DIFFICULTIES[difficulty].description}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
            Zurück
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button className="btn flex-1" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Weiter →
          </button>
        ) : (
          <button className="btn btn-mint flex-1" disabled={saving} onClick={finish}>
            Los geht&apos;s! 🚀
          </button>
        )}
      </div>
    </Page>
  );
}
