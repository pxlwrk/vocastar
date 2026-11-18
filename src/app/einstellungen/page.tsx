"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { DifficultyPicker, GradePicker } from "@/components/Pickers";
import { TabBar } from "@/components/TabBar";
import { Header, Modal, Page } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { setCurrentProfileId } from "@/lib/current-profile";
import { AVATARS, COLORS } from "@/lib/gamification";
import { DIFFICULTIES } from "@/lib/levels";
import { updateProfile } from "@/lib/repo";
import { speak } from "@/lib/speech";
import type { ProfileSettings } from "@/lib/types";

function Toggle({ label, icon, on, onChange }: { label: string; icon: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 w-full py-3 text-left"
    >
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <span className="flex-1 font-display text-lg font-semibold">{label}</span>
      <span className={`relative h-8 w-14 rounded-full transition ${on ? "bg-mint" : "bg-black/15"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}

export default function Settings() {
  const profile = useProfile();
  const router = useRouter();
  const [editLook, setEditLook] = useState(false);
  const [name, setName] = useState<string | null>(null);
  if (!profile) return null;
  const set = (s: Partial<ProfileSettings>) => updateProfile(profile.id, { settings: { ...profile.settings, ...s } });

  return (
    <>
      <Page>
        <Header title="⚙️ Mein Profil" />
        <div className="card p-4 flex items-center gap-4 mb-5">
          <button onClick={() => setEditLook(true)} aria-label="Aussehen ändern">
            <Avatar profile={profile} size={72} />
          </button>
          <div className="flex-1 min-w-0">
            <input
              className="input !min-h-11 font-display !text-xl"
              aria-label="Name"
              value={name ?? profile.name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name && name.trim()) void updateProfile(profile.id, { name: name.trim() });
                setName(null);
              }}
            />
            <button className="text-sm font-semibold text-primary underline mt-1" onClick={() => setEditLook(true)}>
              Tier und Farbe ändern
            </button>
          </div>
        </div>

        <section className="card p-4 mb-4">
          <h2 className="font-display text-lg font-semibold mb-3">Klassenstufe</h2>
          <GradePicker value={profile.grade} onChange={(grade) => updateProfile(profile.id, { grade })} />
        </section>

        <section className="card p-4 mb-4">
          <h2 className="font-display text-lg font-semibold mb-3">Schwierigkeit</h2>
          <DifficultyPicker value={profile.difficulty} onChange={(difficulty) => updateProfile(profile.id, { difficulty })} />
          <p className="text-sm text-ink-soft font-semibold mt-3 text-center">{DIFFICULTIES[profile.difficulty].description}</p>
        </section>

        <section className="card p-4 mb-4">
          <h2 className="font-display text-lg font-semibold mb-2">🎯 Tagesziel</h2>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 30, 50].map((g) => (
              <button
                key={g}
                onClick={() => updateProfile(profile.id, { dailyGoal: g })}
                className={`rounded-2xl border-2 py-2 font-display font-semibold ${profile.dailyGoal === g ? "border-primary bg-primary/10" : "border-line bg-white"}`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-soft font-semibold mt-2 text-center">Wörter pro Tag</p>
        </section>

        <section className="card px-4 py-1 mb-4 divide-y-2 divide-line">
          <Toggle label="Töne" icon="🎵" on={profile.settings.sound} onChange={(sound) => set({ sound })} />
          <Toggle label="Wörter automatisch vorlesen" icon="🔊" on={profile.settings.autoSpeak} onChange={(autoSpeak) => set({ autoSpeak })} />
          <div className="py-3">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl" aria-hidden>
                🗣️
              </span>
              <span className="font-display text-lg font-semibold">Sprechtempo</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["slow", "🐢 Langsam"],
                  ["normal", "🐇 Normal"],
                ] as const
              ).map(([r, label]) => (
                <button
                  key={r}
                  onClick={() => {
                    void set({ speechRate: r });
                    speak("Hello, how are you?", "en-GB", r);
                  }}
                  className={`rounded-2xl border-2 py-2 font-display font-semibold ${profile.settings.speechRate === r ? "border-primary bg-primary/10" : "border-line bg-white"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3">
          <button
            className="btn btn-sky w-full"
            onClick={() => {
              setCurrentProfileId(null);
              router.push("/");
            }}
          >
            👋 Profil wechseln
          </button>
          <Link href="/eltern" className="btn btn-ghost w-full">
            🔐 Elternbereich
          </Link>
        </div>
      </Page>
      <TabBar />

      <Modal open={editLook} onClose={() => setEditLook(false)}>
        <div className="flex justify-center mb-4">
          <Avatar profile={profile} size={96} />
        </div>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => updateProfile(profile.id, { avatar: a })}
              className={`aspect-square rounded-2xl text-4xl border-2 ${a === profile.avatar ? "border-primary bg-primary/10" : "border-line bg-white"}`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          {COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Farbe ${c}`}
              onClick={() => updateProfile(profile.id, { color: c })}
              className={`h-11 w-11 rounded-full border-4 ${c === profile.color ? "border-ink" : "border-white"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <button className="btn w-full" onClick={() => setEditLook(false)}>
          Fertig
        </button>
      </Modal>
    </>
  );
}
