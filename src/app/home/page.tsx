"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Avatar } from "@/components/Avatar";
import { ListCard } from "@/components/ListCard";
import { TabBar } from "@/components/TabBar";
import { Page, Pill, ProgressBar } from "@/components/ui";
import { SpeechBubble, Voki } from "@/components/Voki";
import { useProfile } from "@/hooks/useProfile";
import { db } from "@/lib/db";
import { levelFromXp, todayProgress, visibleStreak } from "@/lib/gamification";
import { DIFFICULTIES } from "@/lib/levels";

function greeting(name: string, streak: number, today: number, goal: number, welcome: boolean) {
  if (welcome) return `Willkommen, ${name}! Leg los mit deiner ersten Vokabelliste.`;
  if (today >= goal) return `Tagesziel geschafft, ${name}! Du bist spitze! 🎉`;
  if (streak >= 2) return `${streak} Tage in Folge! Mach heute weiter, ${name}!`;
  const h = new Date().getHours();
  if (h < 11) return `Guten Morgen, ${name}! Bereit für ein paar Wörter?`;
  if (h > 18) return `Guten Abend, ${name}! Noch eine kleine Runde?`;
  return `Hallo ${name}! Schön, dass du da bist.`;
}

export default function Home() {
  const profile = useProfile();
  const welcome = useSearchParams().has("willkommen");
  const lists = useLiveQuery(
    async () => (profile ? db.lists.where("profileId").equals(profile.id).reverse().sortBy("updatedAt") : []),
    [profile?.id],
  );
  if (!profile || !lists) return null;

  const lvl = levelFromXp(profile.xp);
  const streak = visibleStreak(profile);
  const today = todayProgress(profile);
  const gradeLists = lists.filter((l) => l.grade === profile.grade);
  const otherLists = lists.filter((l) => l.grade !== profile.grade);
  const continueList = gradeLists[0] ?? lists[0];
  const diff = DIFFICULTIES[profile.difficulty];

  return (
    <>
      <Page>
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" aria-label="Profil wechseln">
            <Avatar profile={profile} size={58} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-semibold truncate">{profile.name}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary whitespace-nowrap">Lv {lvl.level}</span>
              <ProgressBar value={lvl.current} max={lvl.needed} color="var(--primary)" className="!h-2.5 flex-1" />
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Pill>
              <span aria-hidden>🔥</span> {streak}
            </Pill>
            <Pill>
              <span aria-hidden>⭐</span> {profile.stars}
            </Pill>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <Voki mood={today >= profile.dailyGoal ? "cheer" : "happy"} size={92} className="anim-float shrink-0" />
          <SpeechBubble>{greeting(profile.name, streak, today, profile.dailyGoal, welcome && !lists.length)}</SpeechBubble>
        </div>

        <section className="card p-4 mb-5">
          <div className="flex justify-between items-baseline mb-2">
            <h2 className="font-display text-lg font-semibold">🎯 Tagesziel</h2>
            <span className="font-display font-semibold text-ink-soft">
              {Math.min(today, profile.dailyGoal)} / {profile.dailyGoal} Wörter
            </span>
          </div>
          <ProgressBar value={today} max={profile.dailyGoal} color="var(--sun)" />
          {continueList ? (
            <Link href={`/spielen/${continueList.id}`} className="btn btn-mint w-full mt-4 !text-xl !min-h-16">
              ▶ Weiterlernen: {continueList.emoji} {continueList.title}
            </Link>
          ) : (
            <Link href="/listen/neu" className="btn btn-mint w-full mt-4 !text-xl !min-h-16">
              ＋ Erste Liste anlegen
            </Link>
          )}
          <p className="text-center text-sm text-ink-soft mt-3 font-semibold">
            Schwierigkeit: {diff.emoji} {diff.label} ·{" "}
            <Link href="/einstellungen" className="underline">
              ändern
            </Link>
          </p>
        </section>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-semibold">Meine Listen · Klasse {profile.grade}</h2>
          <Link href="/listen/neu" className="btn btn-sun !min-h-10 !px-3 !text-base">
            ＋ Neu
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {gradeLists.map((l) => (
            <ListCard key={l.id} list={l} profileId={profile.id} />
          ))}
          {!gradeLists.length && (
            <div className="card p-5 text-center text-ink-soft font-semibold">
              Noch keine Listen für Klasse {profile.grade}. Tippe Vokabeln ein oder fotografiere sie aus dem Buch! 📸
            </div>
          )}
        </div>
        {otherLists.length > 0 && (
          <>
            <h2 className="font-display text-lg font-semibold mt-6 mb-3 text-ink-soft">Andere Klassenstufen</h2>
            <div className="flex flex-col gap-3">
              {otherLists.map((l) => (
                <ListCard key={l.id} list={l} profileId={profile.id} />
              ))}
            </div>
          </>
        )}
      </Page>
      <TabBar />
    </>
  );
}
