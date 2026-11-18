import { db, uid } from "./db";
import { applyAnswer, emptyProgress, isMastered } from "./leitner";
import {
  ACHIEVEMENTS,
  levelFromXp,
  starsForAccuracy,
  updateStreak,
  SHOP_ITEMS,
} from "./gamification";
import type {
  Difficulty,
  GameMode,
  Grade,
  Profile,
  Progress,
  VocabList,
  Word,
  WordPair,
} from "./types";

export async function createProfile(input: {
  name: string;
  avatar: string;
  color: string;
  grade: Grade;
  difficulty: Difficulty;
}): Promise<Profile> {
  const now = Date.now();
  const profile: Profile = {
    id: uid(),
    ...input,
    xp: 0,
    stars: 0,
    streak: 0,
    bestStreak: 0,
    todayCount: 0,
    dailyGoal: 20,
    unlockedItems: [],
    settings: { autoSpeak: input.difficulty === "leicht", sound: true, speechRate: "normal" },
    createdAt: now,
    updatedAt: now,
  };
  await db.profiles.add(profile);
  return profile;
}

export async function updateProfile(id: string, changes: Partial<Profile>) {
  await db.profiles.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteProfile(id: string) {
  await db.transaction("rw", [db.profiles, db.lists, db.words, db.progress, db.achievements, db.sessions], async () => {
    const lists = await db.lists.where("profileId").equals(id).primaryKeys();
    await db.words.where("listId").anyOf(lists).delete();
    await db.lists.bulkDelete(lists);
    await db.progress.where("profileId").equals(id).delete();
    await db.achievements.where("profileId").equals(id).delete();
    await db.sessions.where("profileId").equals(id).delete();
    await db.profiles.delete(id);
  });
}

export async function createList(input: {
  profileId: string;
  title: string;
  targetLang: string;
  grade: Grade;
  emoji: string;
  words?: WordPair[];
}): Promise<VocabList> {
  const now = Date.now();
  const list: VocabList = {
    id: uid(),
    profileId: input.profileId,
    title: input.title,
    targetLang: input.targetLang,
    grade: input.grade,
    emoji: input.emoji,
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction("rw", db.lists, db.words, db.achievements, async () => {
    await db.lists.add(list);
    if (input.words?.length) await addWords(list.id, input.words);
    await unlock(input.profileId, ["first-list"]);
  });
  return list;
}

export async function updateList(id: string, changes: Partial<VocabList>) {
  await db.lists.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteList(id: string) {
  await db.transaction("rw", db.lists, db.words, db.progress, async () => {
    const wordIds = await db.words.where("listId").equals(id).primaryKeys();
    await db.progress.where("wordId").anyOf(wordIds).delete();
    await db.words.bulkDelete(wordIds);
    await db.lists.delete(id);
  });
}

export async function addWords(listId: string, pairs: WordPair[]) {
  const base = Date.now() * 1000;
  const words: Word[] = pairs
    .filter((p) => p.de.trim() && p.foreign.trim())
    .map((p, i) => ({
      id: uid(),
      listId,
      de: p.de.trim(),
      foreign: p.foreign.trim(),
      hint: p.hint?.trim() || undefined,
      order: base + i,
    }));
  await db.words.bulkAdd(words);
  await db.lists.update(listId, { updatedAt: Date.now() });
  return words;
}

export async function updateWord(id: string, changes: Partial<Word>) {
  await db.words.update(id, changes);
}

export async function deleteWord(id: string) {
  await db.words.delete(id);
  await db.progress.where("wordId").equals(id).delete();
}

export async function getListWithWords(listId: string) {
  const list = await db.lists.get(listId);
  const words = await db.words.where("listId").equals(listId).sortBy("order");
  return { list, words };
}

export async function progressMap(profileId: string, wordIds: string[]): Promise<Map<string, Progress>> {
  const rows = await db.progress.where("[profileId+wordId]").anyOf(wordIds.map((w) => [profileId, w])).toArray();
  return new Map(rows.map((r) => [r.wordId, r]));
}

async function unlock(profileId: string, keys: string[]): Promise<string[]> {
  const fresh: string[] = [];
  for (const key of keys) {
    const has = await db.achievements.get([profileId, key]);
    if (!has) {
      await db.achievements.add({ profileId, key, unlockedAt: Date.now() });
      fresh.push(key);
    }
  }
  return fresh;
}

export async function unlockAchievement(profileId: string, key: string) {
  return unlock(profileId, [key]);
}

export interface AnswerRecord {
  wordId: string;
  correct: boolean;
}

export interface RoundResult {
  xp: number;
  stars: number;
  correct: number;
  total: number;
  leveledUp: boolean;
  newLevel: number;
  newAchievements: string[];
  goalReached: boolean;
}

/** Speichert eine gespielte Runde: Fortschritt, XP, Sterne, Serie, Abzeichen. */
export async function recordRound(input: {
  profileId: string;
  listId: string;
  mode: GameMode;
  difficulty: Difficulty;
  answers: AnswerRecord[];
  xp: number;
  maxCombo: number;
  durationMs: number;
  score?: number;
}): Promise<RoundResult> {
  const { profileId, answers } = input;
  return db.transaction("rw", [db.profiles, db.progress, db.achievements, db.sessions, db.words], async () => {
    const profile = await db.profiles.get(profileId);
    if (!profile) throw new Error("Profil fehlt");

    // Leitner-Fortschritt
    const now = Date.now();
    for (const a of answers) {
      const cur = (await db.progress.get([profileId, a.wordId])) ?? emptyProgress(profileId, a.wordId);
      await db.progress.put(applyAnswer(cur, a.correct, now));
    }

    const correct = answers.filter((a) => a.correct).length;
    const total = answers.length;
    const accuracy = total ? correct / total : 0;
    const stars = starsForAccuracy(accuracy);
    const xp = Math.round(input.xp);

    const before = levelFromXp(profile.xp);
    const after = levelFromXp(profile.xp + xp);
    const streakInfo = updateStreak(profile, total);
    const prevCount = profile.todayDate === streakInfo.todayDate ? profile.todayCount : 0;
    const goalReached = prevCount < profile.dailyGoal && streakInfo.todayCount >= profile.dailyGoal;

    await db.profiles.update(profileId, {
      xp: profile.xp + xp,
      stars: profile.stars + stars,
      ...streakInfo,
      updatedAt: now,
    });

    await db.sessions.add({
      id: uid(),
      profileId,
      listId: input.listId,
      mode: input.mode,
      difficulty: input.difficulty,
      correct,
      total,
      xp,
      stars,
      durationMs: input.durationMs,
      date: now,
    });

    // Abzeichen prüfen
    const keys: string[] = ["first-game"];
    if (total >= 5 && correct === total) keys.push("perfect");
    if (input.maxCombo >= 10) keys.push("combo-10");
    if (streakInfo.streak >= 3) keys.push("streak-3");
    if (streakInfo.streak >= 7) keys.push("streak-7");
    if (goalReached) keys.push("daily-goal");
    if (input.difficulty === "schwer" && stars === 3 && total >= 5) keys.push("hard-mode");
    if (input.mode === "blitz" && (input.score ?? correct) >= 15) keys.push("blitz-15");
    if (after.level >= 5) keys.push("level-5");
    const mastered = (await db.progress.where("profileId").equals(profileId).toArray()).filter(isMastered).length;
    if (mastered >= 25) keys.push("mastered-25");
    if (mastered >= 100) keys.push("mastered-100");
    const modes = new Set((await db.sessions.where("profileId").equals(profileId).toArray()).map((s) => s.mode));
    if (modes.size >= 7) keys.push("all-modes");
    const newAchievements = await unlock(profileId, keys);

    return {
      xp,
      stars,
      correct,
      total,
      leveledUp: after.level > before.level,
      newLevel: after.level,
      newAchievements,
      goalReached,
    };
  });
}

export async function buyItem(profileId: string, itemId: string): Promise<boolean> {
  const item = SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) return false;
  return db.transaction("rw", db.profiles, db.achievements, async () => {
    const p = await db.profiles.get(profileId);
    if (!p || p.stars < item.price || p.unlockedItems.includes(itemId)) return false;
    await db.profiles.update(profileId, {
      stars: p.stars - item.price,
      unlockedItems: [...p.unlockedItems, itemId],
      equippedItem: itemId,
      updatedAt: Date.now(),
    });
    await unlock(profileId, ["shopper"]);
    return true;
  });
}

export function achievementDef(key: string) {
  return ACHIEVEMENTS.find((a) => a.key === key);
}
