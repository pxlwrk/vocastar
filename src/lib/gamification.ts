import type { Profile } from "./types";

export const XP_PER_CORRECT = 10;
export const XP_ALMOST = 5;

/** XP-Kurve: Level n braucht 100 + (n-1)*50 XP. */
export function levelFromXp(xp: number): { level: number; current: number; needed: number } {
  let level = 1;
  let rest = xp;
  let needed = 100;
  while (rest >= needed) {
    rest -= needed;
    level++;
    needed = 100 + (level - 1) * 50;
  }
  return { level, current: rest, needed };
}

export function comboBonus(combo: number): number {
  if (combo >= 10) return 5;
  if (combo >= 5) return 3;
  if (combo >= 3) return 1;
  return 0;
}

export function starsForAccuracy(accuracy: number): number {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy > 0) return 1;
  return 0;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T12:00:00");
  const dbb = new Date(b + "T12:00:00");
  return Math.round((dbb.getTime() - da.getTime()) / 86400000);
}

/** Aktualisiert Serie und Tageszähler nach einer gespielten Runde. */
export function updateStreak(
  p: Pick<Profile, "streak" | "bestStreak" | "lastPlayedDate" | "todayDate" | "todayCount">,
  answered: number,
  today = todayKey(),
) {
  let streak = p.streak;
  if (p.lastPlayedDate !== today) {
    const gap = p.lastPlayedDate ? daysBetween(p.lastPlayedDate, today) : Infinity;
    streak = gap === 1 ? streak + 1 : 1;
  }
  const todayCount = (p.todayDate === today ? p.todayCount : 0) + answered;
  return {
    streak,
    bestStreak: Math.max(p.bestStreak, streak),
    lastPlayedDate: today,
    todayDate: today,
    todayCount,
  };
}

/** Serie anzeigen: verfällt, wenn gestern nicht gespielt wurde. */
export function visibleStreak(p: Pick<Profile, "streak" | "lastPlayedDate">, today = todayKey()): number {
  if (!p.lastPlayedDate) return 0;
  const gap = daysBetween(p.lastPlayedDate, today);
  return gap <= 1 ? p.streak : 0;
}

export function todayProgress(p: Pick<Profile, "todayDate" | "todayCount">, today = todayKey()): number {
  return p.todayDate === today ? p.todayCount : 0;
}

export interface AchievementDef {
  key: string;
  emoji: string;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first-list", emoji: "📒", title: "Sammler", description: "Erste eigene Vokabelliste angelegt" },
  { key: "first-game", emoji: "🎮", title: "Los geht's", description: "Erste Runde gespielt" },
  { key: "perfect", emoji: "💯", title: "Fehlerfrei", description: "Eine Runde ohne Fehler geschafft" },
  { key: "combo-10", emoji: "🔥", title: "Feuerwerk", description: "10 richtige Antworten am Stück" },
  { key: "streak-3", emoji: "📅", title: "Dranbleiber", description: "3 Tage in Folge gelernt" },
  { key: "streak-7", emoji: "🏆", title: "Wochen-Held", description: "7 Tage in Folge gelernt" },
  { key: "mastered-25", emoji: "🧠", title: "Wortschatz", description: "25 Wörter gemeistert" },
  { key: "mastered-100", emoji: "🎓", title: "Wort-Profi", description: "100 Wörter gemeistert" },
  { key: "daily-goal", emoji: "🎯", title: "Tagesziel", description: "Das Tagesziel erreicht" },
  { key: "hard-mode", emoji: "🦁", title: "Mutig", description: "Eine Runde auf „Schwer“ mit 3 Sternen" },
  { key: "all-modes", emoji: "🌈", title: "Allrounder", description: "Jedes Spiel einmal ausprobiert" },
  { key: "blitz-15", emoji: "⚡", title: "Blitzschnell", description: "15 Treffer in einer Blitzrunde" },
  { key: "photo", emoji: "📸", title: "Fotograf", description: "Vokabeln per Foto importiert" },
  { key: "level-5", emoji: "⭐", title: "Aufsteiger", description: "Level 5 erreicht" },
  { key: "shopper", emoji: "🎁", title: "Schatzjäger", description: "Etwas im Schatzladen gekauft" },
];

export interface ShopItem {
  id: string;
  emoji: string;
  name: string;
  price: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "cap", emoji: "🧢", name: "Kappe", price: 5 },
  { id: "bow", emoji: "🎀", name: "Schleife", price: 8 },
  { id: "glasses", emoji: "🕶️", name: "Sonnenbrille", price: 12 },
  { id: "flower", emoji: "🌸", name: "Blume", price: 15 },
  { id: "tophat", emoji: "🎩", name: "Zylinder", price: 20 },
  { id: "headphones", emoji: "🎧", name: "Kopfhörer", price: 25 },
  { id: "crown", emoji: "👑", name: "Krone", price: 40 },
  { id: "rocket", emoji: "🚀", name: "Rakete", price: 60 },
  { id: "unicorn", emoji: "🦄", name: "Einhorn", price: 80 },
];

export const AVATARS = ["🦊", "🐼", "🐯", "🐸", "🐙", "🦄", "🐨", "🦁", "🐧", "🐶", "🐱", "🐰", "🦖", "🐬", "🦉", "🐝"];
export const COLORS = ["#8B5CF6", "#F97316", "#10B981", "#3B82F6", "#EC4899", "#EAB308", "#14B8A6", "#EF4444"];

export const PRAISE = ["Super!", "Klasse!", "Stark!", "Genau!", "Wow!", "Spitze!", "Richtig!", "Toll gemacht!"];
export const ENCOURAGE = ["Fast! Weiter so.", "Nicht schlimm, beim nächsten Mal!", "Gleich hast du's!", "Übung macht den Meister."];

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
