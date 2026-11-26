import { db } from "./db";
import { migrateProfile } from "./shop";
import type { Achievement, GameSession, Profile, Progress, VocabList, Word } from "./types";

export interface ProfileSnapshot {
  version: 1;
  exportedAt: number;
  profile: Profile;
  lists: VocabList[];
  words: Word[];
  progress: Progress[];
  achievements: Achievement[];
  sessions: GameSession[];
}

export interface ListSnapshot {
  version: 1;
  list: Pick<VocabList, "title" | "targetLang" | "grade" | "emoji">;
  words: { de: string; foreign: string; hint?: string }[];
}

export async function exportProfile(profileId: string): Promise<ProfileSnapshot> {
  const profile = await db.profiles.get(profileId);
  if (!profile) throw new Error("Profil nicht gefunden");
  const lists = await db.lists.where("profileId").equals(profileId).toArray();
  const words = await db.words.where("listId").anyOf(lists.map((l) => l.id)).toArray();
  return {
    version: 1,
    exportedAt: Date.now(),
    profile,
    lists,
    words,
    progress: await db.progress.where("profileId").equals(profileId).toArray(),
    achievements: await db.achievements.where("profileId").equals(profileId).toArray(),
    sessions: await db.sessions.where("profileId").equals(profileId).toArray(),
  };
}

/** Übernimmt einen Profil-Snapshot. Neuere Stände gewinnen (last write wins). */
export async function importProfile(snap: ProfileSnapshot): Promise<{ profileId: string; replaced: boolean }> {
  if (snap?.version !== 1 || !snap.profile?.id) throw new Error("Ungültige Datei");
  return db.transaction("rw", [db.profiles, db.lists, db.words, db.progress, db.achievements, db.sessions], async () => {
    snap = { ...snap, profile: migrateProfile(snap.profile) };
    const existing = await db.profiles.get(snap.profile.id);
    const replaced = !!existing;
    if (!existing || existing.updatedAt <= snap.profile.updatedAt) {
      await db.profiles.put(snap.profile);
    }
    for (const l of snap.lists) {
      const cur = await db.lists.get(l.id);
      if (!cur || cur.updatedAt <= l.updatedAt) {
        await db.lists.put(l);
        await db.words.where("listId").equals(l.id).delete();
        await db.words.bulkPut(snap.words.filter((w) => w.listId === l.id));
      }
    }
    for (const p of snap.progress) {
      const cur = await db.progress.get([p.profileId, p.wordId]);
      if (!cur || cur.lastSeen <= p.lastSeen) await db.progress.put(p);
    }
    await db.achievements.bulkPut(snap.achievements);
    await db.sessions.bulkPut(snap.sessions);
    return { profileId: snap.profile.id, replaced };
  });
}

export async function exportList(listId: string): Promise<ListSnapshot> {
  const list = await db.lists.get(listId);
  if (!list) throw new Error("Liste nicht gefunden");
  const words = await db.words.where("listId").equals(listId).sortBy("order");
  return {
    version: 1,
    list: { title: list.title, targetLang: list.targetLang, grade: list.grade, emoji: list.emoji },
    words: words.map((w) => ({ de: w.de, foreign: w.foreign, hint: w.hint })),
  };
}
