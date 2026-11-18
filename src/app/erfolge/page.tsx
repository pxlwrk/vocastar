"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { TabBar } from "@/components/TabBar";
import { Header, Modal, Page, Pill, ProgressBar } from "@/components/ui";
import { useProfile } from "@/hooks/useProfile";
import { db } from "@/lib/db";
import { ACHIEVEMENTS, levelFromXp, SHOP_ITEMS, todayKey, visibleStreak } from "@/lib/gamification";
import { isMastered } from "@/lib/leitner";
import { buyItem, updateProfile } from "@/lib/repo";
import { sfx } from "@/lib/sound";

type Tab = "abzeichen" | "laden" | "familie";

export default function Achievements() {
  const profile = useProfile();
  const [tab, setTab] = useState<Tab>("abzeichen");
  const [buyFor, setBuyFor] = useState<string | null>(null);
  const data = useLiveQuery(async () => {
    if (!profile) return null;
    const unlocked = await db.achievements.where("profileId").equals(profile.id).toArray();
    const prog = await db.progress.where("profileId").equals(profile.id).toArray();
    const sessions = await db.sessions.where("profileId").equals(profile.id).toArray();
    const profiles = await db.profiles.toArray();
    const weekAgo = Date.now() - 7 * 86400000;
    const weekly = await Promise.all(
      profiles.map(async (p) => ({
        p,
        xp: (await db.sessions.where("profileId").equals(p.id).toArray()).filter((s) => s.date >= weekAgo).reduce((a, s) => a + s.xp, 0),
      })),
    );
    return {
      unlocked: new Map(unlocked.map((u) => [u.key, u.unlockedAt])),
      mastered: prog.filter(isMastered).length,
      learned: prog.length,
      rounds: sessions.length,
      weekly: weekly.sort((a, b) => b.xp - a.xp),
    };
  }, [profile?.id, profile?.xp]);

  if (!profile || !data) return null;
  const lvl = levelFromXp(profile.xp);
  const item = SHOP_ITEMS.find((i) => i.id === buyFor);

  return (
    <>
      <Page>
        <Header title="🏆 Erfolge" />
        <div className="card p-4 flex items-center gap-4 mb-4">
          <Avatar profile={profile} size={72} />
          <div className="flex-1">
            <div className="font-display text-2xl font-bold">Level {lvl.level}</div>
            <ProgressBar value={lvl.current} max={lvl.needed} color="var(--primary)" className="my-1" />
            <div className="text-sm text-ink-soft font-semibold">
              Noch {lvl.needed - lvl.current} XP bis Level {lvl.level + 1}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-5 text-center">
          {[
            { v: visibleStreak(profile), l: "Tage 🔥" },
            { v: profile.stars, l: "Sterne ⭐" },
            { v: data.mastered, l: "gemeistert" },
            { v: data.rounds, l: "Runden" },
          ].map((s) => (
            <div key={s.l} className="card py-3 px-1">
              <div className="font-display text-2xl font-bold">{s.v}</div>
              <div className="text-xs font-bold text-ink-soft">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-black/5 mb-4">
          {(
            [
              ["abzeichen", "🎖️ Abzeichen"],
              ["laden", "🎁 Schatzladen"],
              ["familie", "👨‍👩‍👧 Familie"],
            ] as [Tab, string][]
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl py-2 font-display font-semibold text-sm ${tab === t ? "bg-white shadow" : "text-ink-soft"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "abzeichen" && (
          <div className="grid grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const has = data.unlocked.has(a.key);
              return (
                <div key={a.key} className={`card p-3 flex flex-col items-center text-center gap-1 ${has ? "" : "opacity-50"}`}>
                  <span className={`text-4xl ${has ? "" : "grayscale"}`}>{has ? a.emoji : "🔒"}</span>
                  <span className="font-display font-semibold leading-tight">{a.title}</span>
                  <span className="text-xs text-ink-soft font-semibold leading-tight">{a.description}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === "laden" && (
          <>
            <p className="text-center font-semibold text-ink-soft mb-3">
              Tausche deine Sterne gegen Extras für deinen Avatar! Du hast <b className="text-ink">{profile.stars} ⭐</b>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {SHOP_ITEMS.map((it) => {
                const owned = profile.unlockedItems.includes(it.id);
                const equipped = profile.equippedItem === it.id;
                const affordable = profile.stars >= it.price;
                return (
                  <button
                    key={it.id}
                    onClick={() => {
                      if (owned) {
                        sfx.tap();
                        void updateProfile(profile.id, { equippedItem: equipped ? undefined : it.id });
                      } else setBuyFor(it.id);
                    }}
                    className={`card p-3 flex flex-col items-center gap-1 active:scale-95 transition ${equipped ? "!border-primary !bg-primary/10" : ""}`}
                  >
                    <span className="text-4xl">{it.emoji}</span>
                    <span className="font-display font-semibold">{it.name}</span>
                    {owned ? (
                      <Pill className={equipped ? "!bg-primary !text-white !border-primary" : ""}>{equipped ? "Angezogen" : "Anziehen"}</Pill>
                    ) : (
                      <Pill className={affordable ? "" : "opacity-60"}>{it.price} ⭐</Pill>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === "familie" && (
          <div className="flex flex-col gap-2">
            <p className="text-center font-semibold text-ink-soft mb-1">XP der letzten 7 Tage auf diesem Gerät</p>
            {data.weekly.map(({ p, xp }, i) => (
              <div key={p.id} className={`card p-3 flex items-center gap-3 ${p.id === profile.id ? "!border-primary" : ""}`}>
                <span className="font-display text-2xl w-8 text-center">{["🥇", "🥈", "🥉"][i] ?? i + 1}</span>
                <Avatar profile={p} size={44} />
                <span className="font-display text-lg font-semibold flex-1 truncate">{p.name}</span>
                <span className="font-display font-bold text-primary">{xp} XP</span>
              </div>
            ))}
            <p className="text-center text-sm text-ink-soft font-semibold mt-2">Gemeinsam lernen macht doppelt Spaß! Stand: {todayKey()}</p>
          </div>
        )}
      </Page>
      <TabBar />

      <Modal open={!!item} onClose={() => setBuyFor(null)}>
        {item && (
          <div className="text-center">
            <div className="text-7xl mb-2 anim-pop">{item.emoji}</div>
            <h2 className="font-display text-2xl font-semibold mb-1">{item.name}</h2>
            {profile.stars >= item.price ? (
              <>
                <p className="font-semibold text-ink-soft mb-4">Für {item.price} ⭐ kaufen?</p>
                <div className="flex gap-2">
                  <button className="btn btn-ghost flex-1" onClick={() => setBuyFor(null)}>
                    Nein
                  </button>
                  <button
                    className="btn btn-sun flex-1"
                    onClick={async () => {
                      if (await buyItem(profile.id, item.id)) sfx.coin();
                      setBuyFor(null);
                    }}
                  >
                    Kaufen!
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold text-ink-soft mb-4">
                  Dir fehlen noch {item.price - profile.stars} ⭐. Spiel ein paar Runden, dann klappt&apos;s!
                </p>
                <button className="btn w-full" onClick={() => setBuyFor(null)}>
                  Okay
                </button>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
