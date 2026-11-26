"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Avatar } from "@/components/Avatar";
import { Page } from "@/components/ui";
import { SpeechBubble, Voki } from "@/components/Voki";
import { db } from "@/lib/db";
import { setCurrentProfileId } from "@/lib/current-profile";
import { levelFromXp, visibleStreak } from "@/lib/gamification";
import { sfx } from "@/lib/sound";

export default function WhoIsLearning() {
  const router = useRouter();
  const profiles = useLiveQuery(() => db.profiles.orderBy("name").toArray(), []);

  if (!profiles) return null;

  return (
    <Page tabs={false}>
      <div className="flex items-center gap-2 mt-4 mb-6">
        <Voki mood="happy" size={104} className="anim-float shrink-0" />
        <SpeechBubble>
          {profiles.length ? "Hallo! Wer lernt heute mit mir?" : "Hallo, ich bin Voki! Lass uns zusammen Vokabeln lernen."}
        </SpeechBubble>
      </div>

      <h1 className="font-display text-3xl font-bold mb-4 text-center">
        Voca<span className="text-primary">Star</span> ⭐
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {profiles.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              sfx.tap();
              setCurrentProfileId(p.id);
              router.push("/home");
            }}
            className="card p-4 flex flex-col items-center gap-2 active:scale-95 transition anim-pop"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Avatar profile={p} size={84} />
            <span className="font-display text-xl font-semibold truncate max-w-full">{p.name}</span>
            <span className="text-sm text-ink-soft font-semibold">
              Level {levelFromXp(p.xp).level} · Klasse {p.grade}
              {visibleStreak(p) > 0 && ` · 🔥${visibleStreak(p)}`}
            </span>
          </button>
        ))}
        <Link
          href="/profil/neu"
          className="rounded-3xl border-4 border-dashed border-primary/40 p-4 flex flex-col items-center justify-center gap-2 min-h-44 text-primary active:scale-95 transition bg-white/50"
        >
          <span className="text-5xl" aria-hidden>
            ＋
          </span>
          <span className="font-display text-lg font-semibold">Neues Profil</span>
        </Link>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 text-sm text-ink-soft">
        <Link href="/teilen" className="underline font-semibold">
          Code von einem anderen Gerät eingeben
        </Link>
        <p className="text-center max-w-xs">
          Keine Anmeldung nötig. Alle Daten bleiben auf diesem Gerät.
        </p>
      </div>
    </Page>
  );
}
